/**
 * Cloudflare Pages Function: /api/food-scan-ocr
 *
 * POST — Camera-based food ingredient scanning for HealthyScan
 * Accepts base64 image → Google Cloud Vision OCR → Claude Haiku parsing → /api/food-scan
 *
 * Body: { "image": "base64_encoded_image_data" }
 * Environment: DB (D1 benda-ingredients), GOOGLE_VISION_KEY, ANTHROPIC_API_KEY
 */

const ALLOWED_ORIGINS = [
    'https://healthy-scan.app',
    'https://www.healthy-scan.app',
    'https://healthyscan.pages.dev',
    'https://getpiro.com',
    'http://localhost:8765',
    'http://localhost:8788',
    'http://127.0.0.1:8788',
];

function getCorsHeaders(request) {
    const origin = request.headers.get('Origin') || '';
    const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    return {
        'Access-Control-Allow-Origin': allowed,
        'Access-Control-Allow-Headers': 'content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Vary': 'Origin',
    };
}

const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
};

const RATE_LIMIT = {
    MAX_PER_MINUTE: 10,
    MAX_PER_DAY: 10,
    WINDOW_SECONDS: 60,
    DAY_SECONDS: 86400,
    CLEANUP_CHANCE: 0.05,
};

async function checkRateLimit(request, db) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Math.floor(Date.now() / 1000);
    const minuteAgo = now - RATE_LIMIT.WINDOW_SECONDS;
    const dayAgo = now - RATE_LIMIT.DAY_SECONDS;

    try {
        const minuteResult = await db.prepare(
            'SELECT COUNT(*) as cnt FROM rate_limits WHERE ip = ? AND ts > ? AND endpoint = ?'
        ).bind(ip, minuteAgo, 'food-ocr').first();
        if ((minuteResult?.cnt || 0) >= RATE_LIMIT.MAX_PER_MINUTE) {
            return { allowed: false, reason: 'Too many requests. Please wait a moment.' };
        }

        const dayResult = await db.prepare(
            'SELECT COUNT(*) as cnt FROM rate_limits WHERE ip = ? AND ts > ? AND endpoint = ?'
        ).bind(ip, dayAgo, 'food-ocr').first();
        if ((dayResult?.cnt || 0) >= RATE_LIMIT.MAX_PER_DAY) {
            return { allowed: false, reason: 'Daily scan limit reached. Come back tomorrow!' };
        }

        try {
            await db.prepare(
                'INSERT INTO rate_limits (ip, ts, endpoint) VALUES (?, ?, ?)'
            ).bind(ip, now, 'food-ocr').run();
        } catch (e) {
            await db.prepare(
                'INSERT INTO rate_limits (ip, ts) VALUES (?, ?)'
            ).bind(ip, now).run();
        }

        if (Math.random() < RATE_LIMIT.CLEANUP_CHANCE) {
            await db.prepare('DELETE FROM rate_limits WHERE ts < ?').bind(dayAgo - 60).run();
        }

        return { allowed: true };
    } catch (e) {
        console.error('Food OCR rate limit error:', e.message);
        return { allowed: true };
    }
}

// ============================================================
// GOOGLE CLOUD VISION OCR
// ============================================================
async function performOCR(imageBase64, apiKey) {
    const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [{
                    image: { content: imageBase64 },
                    features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
                }],
            }),
        }
    );

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Vision API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const text = data.responses?.[0]?.fullTextAnnotation?.text;
    if (!text) {
        throw new Error('NO_TEXT_DETECTED');
    }
    return text;
}

// ============================================================
// CLAUDE HAIKU — FOOD INGREDIENT PARSING
// ============================================================
async function parseFoodIngredientsWithAI(ocrText, apiKey) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            temperature: 0,
            messages: [{
                role: 'user',
                content: `You are an expert at reading food product labels. Extract the ingredient list from this food label text captured by OCR.

Rules:
- Return ONLY a valid JSON array of ingredient name strings in English
- Keep the original order from the label
- Use standard English ingredient names
- If ingredients are in Hebrew, translate each to standard English:
  סוכר → Sugar, קמח חיטה → Wheat Flour, שמן דקלים → Palm Oil, מלח → Salt,
  חלב → Milk, ביצים → Eggs, שמרים → Yeast, חומצת לימון → Citric Acid,
  תמצית וניל → Vanilla Extract, גלוקוז → Glucose, שומן צמחי → Vegetable Fat,
  אבקת אפייה → Baking Powder, קקאו → Cocoa, חלבון סויה → Soy Protein,
  תירס → Corn, אורז → Rice, שמן זית → Olive Oil, חמאה → Butter
- For E-numbers (E330, E621 etc.), return the common English name if known (e.g., "Citric Acid" for E330, "Monosodium Glutamate" for E621)
- Also include the E-number in parentheses: "Citric Acid (E330)"
- Split compound entries: "סוכר, מלח, קמח" → ["Sugar", "Salt", "Flour"]
- Remove percentages (e.g., "סוכר 15%" → "Sugar")
- Remove NON-ingredient text: brand names, product names, directions, warnings, nutrition facts, serving sizes, barcodes, dates
- Look for "רכיבים:" or "Ingredients:" as the start marker
- If no ingredient list is found, return an empty array []
- Do NOT add any ingredients that aren't in the text

OCR Text:
${ocrText}`,
            }],
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Haiku API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '[]';

    const match = text.match(/\[[\s\S]*?\]/);
    if (!match) return [];

    try {
        const parsed = JSON.parse(match[0]);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(item => typeof item === 'string' && item.trim().length > 0).map(s => s.trim());
    } catch (e) {
        return [];
    }
}

export async function onRequestOptions(context) {
    return new Response('ok', {
        headers: { ...getCorsHeaders(context.request), ...SECURITY_HEADERS }
    });
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const cors = getCorsHeaders(request);
    const headers = { ...cors, ...SECURITY_HEADERS };

    try {
        // Rate limit
        const rateCheck = await checkRateLimit(request, env.DB);
        if (!rateCheck.allowed) {
            return Response.json(
                { error: rateCheck.reason },
                { status: 429, headers: { ...headers, 'Retry-After': '60' } }
            );
        }

        // Validate
        const contentType = request.headers.get('Content-Type') || '';
        if (!contentType.includes('application/json')) {
            return Response.json(
                { error: 'Content-Type must be application/json' },
                { status: 415, headers }
            );
        }

        let body;
        try { body = await request.json(); }
        catch (e) {
            return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers });
        }

        const imageData = body.image;
        if (!imageData || typeof imageData !== 'string') {
            return Response.json(
                { error: 'Request body must include "image" as base64 string' },
                { status: 400, headers }
            );
        }

        // Strip data URI prefix if present
        const base64 = imageData.replace(/^data:image\/[a-z]+;base64,/, '');

        // Size check (~4MB max for Vision API)
        if (base64.length > 5500000) {
            return Response.json(
                { error: 'Image too large. Please use a smaller image.' },
                { status: 413, headers }
            );
        }

        // Check API keys
        if (!env.GOOGLE_VISION_KEY) {
            return Response.json({ error: 'OCR service not configured' }, { status: 503, headers });
        }
        if (!env.ANTHROPIC_API_KEY) {
            return Response.json({ error: 'AI parsing service not configured' }, { status: 503, headers });
        }

        // Step 1: Google Vision OCR
        let ocrText;
        try {
            ocrText = await performOCR(base64, env.GOOGLE_VISION_KEY);
        } catch (e) {
            if (e.message === 'NO_TEXT_DETECTED') {
                return Response.json({
                    error: 'No text detected in image. Please try a clearer photo.',
                    ocrText: null,
                    ingredients: [],
                }, { status: 200, headers });
            }
            throw e;
        }

        // Step 2: Claude Haiku food parsing
        const ingredients = await parseFoodIngredientsWithAI(ocrText, env.ANTHROPIC_API_KEY);

        if (ingredients.length === 0) {
            return Response.json({
                ocrText: ocrText,
                ingredients: [],
                message: 'No food ingredients found in the image.',
            }, { status: 200, headers });
        }

        // Step 3: Forward to food-scan for matching
        // Instead of calling ourselves, inline the matching logic
        // The frontend will call /api/food-scan with the parsed ingredients
        return Response.json({
            ocrText: ocrText,
            ingredients: ingredients,
            count: ingredients.length,
        }, { headers });

    } catch (e) {
        console.error('Food OCR error:', e.message, e.stack);
        return Response.json(
            { error: 'Failed to process image. Please try again.' },
            { status: 500, headers }
        );
    }
}