/**
 * Cloudflare Pages Function: /api/barcode-cache
 *
 * POST — Save a user-contributed barcode → ingredients mapping
 * This builds our crowd-sourced product database.
 * When a barcode isn't found in OFF or D1, the user scans/pastes ingredients.
 * We cache that barcode + ingredients so the NEXT user gets instant results.
 *
 * Body: { "barcode": "7290114827034", "ingredients_text": "tomatoes, sugar, vinegar..." }
 * Environment: DB (D1 benda-ingredients)
 */

const ALLOWED_ORIGINS = [
    'https://healthy-scan.app',
    'https://www.healthy-scan.app',
    'https://healthyscan.pages.dev',
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

export async function onRequestOptions(context) {
    return new Response('ok', {
        headers: { ...getCorsHeaders(context.request), ...SECURITY_HEADERS }
    });
}

const RATE_LIMIT = {
    MAX_PER_MINUTE: 5,
    MAX_PER_DAY: 20,
    WINDOW_SECONDS: 60,
    DAY_SECONDS: 86400,
};

async function checkRateLimit(request, db) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Math.floor(Date.now() / 1000);
    const minuteAgo = now - RATE_LIMIT.WINDOW_SECONDS;
    const dayAgo = now - RATE_LIMIT.DAY_SECONDS;

    try {
        const minuteResult = await db.prepare(
            'SELECT COUNT(*) as cnt FROM rate_limits WHERE ip = ? AND ts > ? AND endpoint = ?'
        ).bind(ip, minuteAgo, 'barcode-cache').first();
        if ((minuteResult?.cnt || 0) >= RATE_LIMIT.MAX_PER_MINUTE) {
            return { allowed: false };
        }

        const dayResult = await db.prepare(
            'SELECT COUNT(*) as cnt FROM rate_limits WHERE ip = ? AND ts > ? AND endpoint = ?'
        ).bind(ip, dayAgo, 'barcode-cache').first();
        if ((dayResult?.cnt || 0) >= RATE_LIMIT.MAX_PER_DAY) {
            return { allowed: false };
        }

        try {
            await db.prepare(
                'INSERT INTO rate_limits (ip, ts, endpoint) VALUES (?, ?, ?)'
            ).bind(ip, now, 'barcode-cache').run();
        } catch (e) {
            await db.prepare(
                'INSERT INTO rate_limits (ip, ts) VALUES (?, ?)'
            ).bind(ip, now).run();
        }

        return { allowed: true };
    } catch (e) {
        return { allowed: true };
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const cors = getCorsHeaders(request);
    const headers = { ...cors, ...SECURITY_HEADERS };

    try {
        // Rate limit — write endpoint, prevent D1 flooding
        if (env.DB) {
            const rateCheck = await checkRateLimit(request, env.DB);
            if (!rateCheck.allowed) {
                return Response.json({ error: 'Too many requests' }, { status: 429, headers });
            }
        }

        const contentType = request.headers.get('Content-Type') || '';
        if (!contentType.includes('application/json')) {
            return Response.json({ error: 'Content-Type must be application/json' }, { status: 415, headers });
        }

        let body;
        try { body = await request.json(); }
        catch (e) {
            return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers });
        }

        const barcode = (body.barcode || '').trim().replace(/\D/g, '');
        const ingredientsText = (body.ingredients_text || '').trim();

        if (!barcode || barcode.length < 8 || barcode.length > 14) {
            return Response.json({ error: 'Invalid barcode' }, { status: 400, headers });
        }
        if (!ingredientsText || ingredientsText.length < 3) {
            return Response.json({ error: 'Ingredients text too short' }, { status: 400, headers });
        }
        if (ingredientsText.length > 5000) {
            return Response.json({ error: 'Ingredients text too long' }, { status: 400, headers });
        }

        // Upsert: insert or update if scanned again with new ingredients
        // NOTE: user_barcode_cache table must exist in D1 schema (moved from runtime DDL)
        await env.DB.prepare(`
            INSERT INTO user_barcode_cache (barcode, ingredients_text, scan_count, created_at, updated_at)
            VALUES (?, ?, 1, datetime('now'), datetime('now'))
            ON CONFLICT(barcode) DO UPDATE SET
                ingredients_text = CASE
                    WHEN length(excluded.ingredients_text) > length(user_barcode_cache.ingredients_text)
                    THEN excluded.ingredients_text
                    ELSE user_barcode_cache.ingredients_text
                END,
                scan_count = user_barcode_cache.scan_count + 1,
                updated_at = datetime('now')
        `).bind(barcode, ingredientsText).run();

        return Response.json({ cached: true, barcode: barcode }, { headers });

    } catch (e) {
        console.error('Barcode cache error:', e.message, e.stack);
        return Response.json({ error: 'Failed to cache barcode' }, { status: 500, headers });
    }
}
