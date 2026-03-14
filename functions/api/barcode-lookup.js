/**
 * Cloudflare Pages Function: /api/barcode-lookup
 *
 * POST — Barcode lookup for HealthyScan
 * Strategy: D1-first (instant ~2ms) → OFF API fallback only if D1 has no ingredients
 *
 * Body: { "barcode": "7290000123456" }
 * Returns enriched data: product info, ingredients, nutrition, allergens, NOVA, Nutri-Score
 * Environment: DB (D1 benda-food)
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

export async function onRequestOptions(context) {
    return new Response('ok', {
        headers: { ...getCorsHeaders(context.request), ...SECURITY_HEADERS }
    });
}

/**
 * Fetch product from Open Food Facts API v2
 * Free, no auth, returns rich data (nutrition, allergens, NOVA, Nutri-Score, images)
 */
async function fetchFromOFF(barcode) {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'HealthyScan/1.0 (https://healthy-scan.app)' },
        cf: { cacheTtl: 3600 }, // Cloudflare edge cache for 1 hour
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;

    // Extract allergens from tags
    const allergens = (p.allergens_tags || [])
        .map(tag => tag.replace(/^en:/, ''))
        .filter(Boolean);

    // Extract additives from tags
    const additives = (p.additives_tags || [])
        .map(tag => tag.replace(/^en:/, '').toUpperCase())
        .filter(Boolean);

    // Build nutrition object from nutriments
    const n = p.nutriments || {};
    const nutrition = {
        energy_kcal: n['energy-kcal_100g'] ?? n['energy-kcal'] ?? null,
        fat: n.fat_100g ?? null,
        saturated_fat: n['saturated-fat_100g'] ?? null,
        carbohydrates: n.carbohydrates_100g ?? null,
        sugars: n.sugars_100g ?? null,
        fiber: n.fiber_100g ?? null,
        protein: n.proteins_100g ?? null,
        sodium: n.sodium_100g != null ? Math.round(n.sodium_100g * 1000) : null, // g → mg
        salt: n.salt_100g ?? null,
        trans_fat: n['trans-fat_100g'] ?? null,
    };

    // Pick best ingredients text — prefer Hebrew, then English, then whatever is there
    const ingredientsText = p.ingredients_text_he
        || p.ingredients_text_en
        || p.ingredients_text
        || '';

    // Extract structured ingredients from OFF's parsed array
    // Each item has { id: "en:wheat-flour", text: "farine de blé", ... }
    // ONLY trust en: prefixed IDs — these are canonical English names
    // Non-en: IDs (fr:, de:, etc.) are untranslated foreign text = garbage for our DB
    const ingredientsParsed = (p.ingredients || [])
        .map(item => {
            if (!item.id) return null;
            // Only accept English canonical IDs
            if (!item.id.startsWith('en:')) return null;
            // "en:wheat-flour" → "wheat flour"
            let clean = item.id
                .substring(3)               // strip "en:"
                .replace(/-/g, ' ');         // hyphens to spaces
            // Normalize British → American spelling for DB matching
            clean = clean
                .replace(/fibre/g, 'fiber')
                .replace(/flavouring/g, 'flavoring')
                .replace(/colour/g, 'color')
                .replace(/stabiliser/g, 'stabilizer')
                .replace(/normaliser/g, 'normalizer')
                .replace(/emulsifier/g, 'emulsifier') // already American, but safe
                .replace(/sulphate/g, 'sulfate')
                .replace(/sulphite/g, 'sulfite')
                .replace(/aluminium/g, 'aluminum')
                .replace(/glycerine/g, 'glycerin')
                .replace(/gelatine/g, 'gelatin');
            return clean || null;
        })
        .filter(Boolean);

    return {
        found: true,
        source: 'off_api',
        barcode: p.code || barcode,
        product_name: p.product_name_en || p.product_name || '',
        product_name_he: p.product_name_he || p.product_name || '',
        brands: p.brands || '',
        categories: p.categories || '',
        ingredients_text: ingredientsText,
        ingredients_parsed: ingredientsParsed.length > 0 ? ingredientsParsed : null,
        ingredients_he: p.ingredients_text_he || '',
        nutrition_grade: p.nutrition_grades || '',
        nutri_score: p.nutriscore_grade || p.nutrition_grades || '',
        nova_group: p.nova_group || 0,
        allergens: allergens,
        additives: additives,
        nutrition: nutrition,
        image_url: p.image_front_small_url || p.image_front_url || '',
        traces: (p.traces_tags || []).map(t => t.replace(/^en:/, '')),
    };
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const cors = getCorsHeaders(request);
    const headers = { ...cors, ...SECURITY_HEADERS };

    try {
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

        const barcode = body.barcode;
        if (!barcode || typeof barcode !== 'string') {
            return Response.json(
                { error: 'Request body must include "barcode" as string', found: false },
                { status: 400, headers }
            );
        }

        // Normalize barcode — strip whitespace, pad to 13 digits if needed
        let normalized = barcode.trim().replace(/\D/g, '');
        if (normalized.length === 0) {
            return Response.json({ found: false, error: 'Invalid barcode' }, { status: 400, headers });
        }

        // Try barcode variants for D1 lookup
        const candidates = [normalized];
        if (normalized.length < 13) {
            candidates.push(normalized.padStart(13, '0'));
        }
        if (normalized.length === 13 && normalized.startsWith('0')) {
            candidates.push(normalized.substring(1));
        }

        // ── Step 1: Try D1 first (instant, ~2ms) ──
        let d1Product = null;
        for (const code of candidates) {
            d1Product = await env.DB.prepare(
                'SELECT barcode, product_name, product_name_he, brands, categories, ingredients_text, ingredients_he, nutrition_grade, nova_group FROM off_products WHERE barcode = ?'
            ).bind(code).first();
            if (d1Product) break;
        }

        // Also check user-contributed barcode cache
        let cachedIngredients = null;
        try {
            for (const code of candidates) {
                const cached = await env.DB.prepare(
                    'SELECT ingredients_text FROM user_barcode_cache WHERE barcode = ?'
                ).bind(code).first();
                if (cached && cached.ingredients_text) {
                    cachedIngredients = cached.ingredients_text;
                    break;
                }
            }
        } catch (e) { /* non-critical */ }

        // ── Step 2: If D1 has ingredients, return INSTANTLY — no external API call ──
        const d1HasIngredients = d1Product &&
            (d1Product.ingredients_text?.length > 5 || d1Product.ingredients_he?.length > 5);

        if (d1HasIngredients) {
            return Response.json({
                found: true,
                source: 'd1',
                barcode: d1Product.barcode,
                product_name: d1Product.product_name || '',
                product_name_he: d1Product.product_name_he || '',
                brands: d1Product.brands || '',
                categories: d1Product.categories || '',
                ingredients_text: d1Product.ingredients_text || cachedIngredients || '',
                ingredients_he: d1Product.ingredients_he || '',
                nutrition_grade: d1Product.nutrition_grade || '',
                nutri_score: d1Product.nutrition_grade || '',
                nova_group: d1Product.nova_group || 0,
                allergens: [],
                additives: [],
                nutrition: null,
                image_url: '',
                traces: [],
            }, { headers });
        }

        // ── Step 3: D1 miss or no ingredients → OFF API fallback ──
        let offResult = null;
        try {
            for (const code of candidates) {
                offResult = await fetchFromOFF(code);
                if (offResult) break;
            }
        } catch (e) {
            console.error('OFF API error (non-fatal):', e.message);
        }

        if (offResult) {
            // Fill gaps from D1/cache
            if (!offResult.ingredients_he && d1Product?.ingredients_he) {
                offResult.ingredients_he = d1Product.ingredients_he;
            }
            if (!offResult.product_name_he && d1Product?.product_name_he) {
                offResult.product_name_he = d1Product.product_name_he;
            }
            if (!offResult.ingredients_text && d1Product?.ingredients_text) {
                offResult.ingredients_text = d1Product.ingredients_text;
            }
            if (!offResult.ingredients_text && cachedIngredients) {
                offResult.ingredients_text = cachedIngredients;
            }
            return Response.json(offResult, { headers });
        }

        // ── Step 4: D1-only (no ingredients but has product info) ──
        if (d1Product) {
            return Response.json({
                found: true,
                source: 'd1',
                barcode: d1Product.barcode,
                product_name: d1Product.product_name || '',
                product_name_he: d1Product.product_name_he || '',
                brands: d1Product.brands || '',
                categories: d1Product.categories || '',
                ingredients_text: cachedIngredients || d1Product.ingredients_text || '',
                ingredients_he: d1Product.ingredients_he || '',
                nutrition_grade: d1Product.nutrition_grade || '',
                nutri_score: d1Product.nutrition_grade || '',
                nova_group: d1Product.nova_group || 0,
                allergens: [],
                additives: [],
                nutrition: null,
                image_url: '',
                traces: [],
            }, { headers });
        }

        // ── Step 5: User cache only ──
        if (cachedIngredients) {
            return Response.json({
                found: true,
                source: 'user_cache',
                barcode: normalized,
                product_name: '',
                product_name_he: '',
                brands: '',
                categories: '',
                ingredients_text: cachedIngredients,
                ingredients_he: '',
                nutrition_grade: '',
                nutri_score: '',
                nova_group: 0,
                allergens: [],
                additives: [],
                nutrition: null,
                image_url: '',
                traces: [],
            }, { headers });
        }

        // ── Nothing found anywhere ──
        return Response.json({
            found: false,
            barcode: normalized,
            message: 'Product not found',
        }, { headers });

    } catch (e) {
        console.error('Barcode lookup error:', e.message, e.stack);
        return Response.json(
            { error: 'Failed to look up barcode', found: false },
            { status: 500, headers }
        );
    }
}
