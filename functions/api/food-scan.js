/**
 * Cloudflare Pages Function: /api/food-scan
 *
 * POST — Food ingredient analysis for HealthyScan
 * Matches food ingredients against D1 database (shared with Piro)
 * Returns food-specific safety scores, ADI values, Israeli regulation status
 *
 * 5-step food matching:
 *   0. Alias resolution (food_aliases + ingredient_aliases)
 *   1. food_additives by common_name / e_number
 *   2. e_number_aliases for E-number variants
 *   3. food_substances by substance_name
 *   4. food_synonyms → food_substances
 *   5. il_permitted_additives for Israeli regulatory status
 *
 * Body: { "ingredients": ["citric acid", "E211", "sugar", ...] }
 * Environment: DB (D1 benda-ingredients)
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
    MAX_PER_MINUTE: 15,
    MAX_PER_DAY: 30,
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
            'SELECT COUNT(*) as cnt FROM rate_limits WHERE ip = ? AND ts > ?'
        ).bind(ip, minuteAgo).first();
        if ((minuteResult?.cnt || 0) >= RATE_LIMIT.MAX_PER_MINUTE) {
            return { allowed: false, reason: 'Too many requests. Please wait a moment.' };
        }

        const dayResult = await db.prepare(
            'SELECT COUNT(*) as cnt FROM rate_limits WHERE ip = ? AND ts > ? AND endpoint = ?'
        ).bind(ip, dayAgo, 'food-scan').first();
        if ((dayResult?.cnt || 0) >= RATE_LIMIT.MAX_PER_DAY) {
            return { allowed: false, reason: 'Daily scan limit reached. Come back tomorrow!' };
        }

        try {
            await db.prepare(
                'INSERT INTO rate_limits (ip, ts, endpoint) VALUES (?, ?, ?)'
            ).bind(ip, now, 'food-scan').run();
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
        console.error('Food-scan rate limit error:', e.message);
        return { allowed: true }; // Fail open
    }
}

const MAX_INGREDIENTS = 80;
const BATCH_SIZE = 40;

// Common food ingredient Hebrew names — also serves as known-safe-foods fallback
const HEBREW_INGREDIENT_NAMES = {
    'sugar': 'סוכר', 'salt': 'מלח', 'water': 'מים', 'flour': 'קמח',
    'wheat flour': 'קמח חיטה', 'corn starch': 'עמילן תירס', 'rice': 'אורז',
    'milk': 'חלב', 'cream': 'שמנת', 'butter': 'חמאה', 'eggs': 'ביצים',
    'egg': 'ביצה', 'honey': 'דבש', 'vinegar': 'חומץ', 'yeast': 'שמרים',
    'palm oil': 'שמן דקל', 'sunflower oil': 'שמן חמניות', 'olive oil': 'שמן זית',
    'canola oil': 'שמן קנולה', 'soybean oil': 'שמן סויה', 'coconut oil': 'שמן קוקוס',
    'vegetable oil': 'שמן צמחי', 'corn oil': 'שמן תירס',
    'tomato': 'עגבנייה', 'tomatoes': 'עגבניות', 'tomato paste': 'רסק עגבניות',
    'onion': 'בצל', 'garlic': 'שום', 'pepper': 'פלפל', 'paprika': 'פפריקה',
    'cinnamon': 'קינמון', 'turmeric': 'כורכום', 'ginger': 'ג\'ינג\'ר',
    'lemon': 'לימון', 'lemon juice': 'מיץ לימון', 'orange': 'תפוז',
    'chocolate': 'שוקולד', 'cocoa': 'קקאו', 'cocoa powder': 'אבקת קקאו',
    'vanilla': 'וניל', 'vanilla extract': 'תמצית וניל',
    'gelatin': 'ג\'לטין', 'pectin': 'פקטין', 'starch': 'עמילן',
    'modified starch': 'עמילן מותאם', 'corn syrup': 'סירופ תירס',
    'glucose syrup': 'סירופ גלוקוז', 'fructose': 'פרוקטוז',
    'sucrose': 'סוכרוז', 'lactose': 'לקטוז', 'maltose': 'מלטוז',
    'dextrose': 'דקסטרוז', 'glucose': 'גלוקוז',
    'soy': 'סויה', 'soy lecithin': 'לציטין סויה', 'soybean': 'סויה',
    'soy protein': 'חלבון סויה', 'whey powder': 'אבקת מי גבינה',
    'milk powder': 'אבקת חלב', 'cheese': 'גבינה', 'yogurt': 'יוגורט',
    'peanuts': 'בוטנים', 'peanut': 'בוטן', 'almonds': 'שקדים',
    'walnuts': 'אגוזי מלך', 'hazelnuts': 'אגוזי לוז', 'cashews': 'קשיו',
    'sesame': 'שומשום', 'sesame seeds': 'זרעי שומשום',
    'wheat': 'חיטה', 'barley': 'שעורה', 'oats': 'שיבולת שועל', 'rye': 'שיפון',
    'corn': 'תירס', 'maize': 'תירס', 'potato': 'תפוח אדמה',
    'sodium chloride': 'מלח', 'acetic acid': 'חומצה אצטית',
    'baking soda': 'סודה לשתייה', 'sodium bicarbonate': 'נתרן דו-פחמתי',
    'calcium carbonate': 'סידן פחמתי', 'iron': 'ברזל',
    'protein': 'חלבון', 'whey': 'מי גבינה', 'whey protein': 'חלבון מי גבינה',
    'casein': 'קזאין', 'gluten': 'גלוטן',
    'skim milk powder': 'אבקת חלב דל שומן', 'skimmed milk powder': 'אבקת חלב דל שומן',
    'hazelnut paste': 'מחית אגוזי לוז', 'hazelnut butter': 'מחית אגוזי לוז',
    'black carrot concentrate': 'רכז גזר שחור', 'black carrot extract': 'תמצית גזר שחור',
    'grape juice': 'מיץ ענבים', 'grape juice from concentrate': 'מיץ ענבים עשוי מרכז',
    'apple juice': 'מיץ תפוחים', 'apple juice from concentrate': 'מיץ תפוחים עשוי מרכז',
    'cocoa paste': 'עגבת קקאו', 'cocoa butter': 'חמאת קקאו', 'cocoa mass': 'מסת קקאו',
    'milk fat': 'שומן חלב', 'butterfat': 'שומן חלב',
    'trisodium citrate': 'תלת נתרן ציטראט', 'sodium citrate': 'נתרן ציטראט',
    'tea extract': 'תמצית תה', 'natural tea extract': 'תמצית תה טבעי',
    'green tea extract': 'תמצית תה ירוק', 'black tea extract': 'תמצית תה שחור',
    'plant extract': 'תמצית צמחית', 'fruit extract': 'תמצית פרי',
    'malt extract': 'תמצית לתת', 'yeast extract': 'תמצית שמרים',
    'black carrot juice': 'מיץ גזר שחור', 'carrot juice': 'מיץ גזר',
    'vitamins': 'ויטמינים', 'minerals': 'מינרלים',
    'preservative': 'חומר משמר', 'coloring': 'צבע מאכל', 'flavoring': 'חומר טעם',
    'natural flavoring': 'טעם טבעי', 'artificial flavoring': 'טעם מלאכותי',
    'flavoring and aroma compounds': 'חומרי טעם וריח', 'aroma compounds': 'חומרי ריח',
    'natural flavors': 'טעמים טבעיים', 'artificial flavors': 'טעמים מלאכותיים',
    'acidity regulators': 'מווסתי חומציות', 'acidity regulator': 'מוסת חומציות',
    'antioxidants': 'נוגדי חמצון', 'antioxidant': 'נוגד חמצון',
    'emulsifiers': 'מתחלבים', 'emulsifier': 'מתחלב',
    'stabilizers': 'מייצבים', 'stabilizer': 'מייצב',
    'thickeners': 'מעבים', 'thickener': 'מעבה',
    'raising agents': 'חומרי תפיחה', 'raising agent': 'חומר תפיחה',
    'anti-caking agents': 'חומרים נוגדי גיבוש', 'anti-caking agent': 'חומר נוגד גיבוש',
    'humectants': 'חומרי לחות', 'humectant': 'חומר לחות',
    'glazing agents': 'חומרי ציפוי', 'glazing agent': 'חומר ציפוי',
    'citric acid': 'חומצת לימון', 'ascorbic acid': 'חומצה אסקורבית (ויטמין C)',
    'lactic acid': 'חומצה לקטית', 'phosphoric acid': 'חומצה זרחתית',
    'mono and diglycerides': 'מונו ודיגליצרידים',
    'lettuce': 'חזרת', 'celery': 'סלרי', 'carrot': 'גזר', 'cucumber': 'מלפפון',
    'spinach': 'תרד', 'parsley': 'פטרוזיליה', 'dill': 'שמיר', 'basil': 'בזיליקום',
    'thyme': 'טימין', 'oregano': 'אורגנו', 'rosemary': 'רוזמרין',
    'mustard': 'חרדל', 'mustard seeds': 'זרעי חרדל',
    'soy sauce': 'רוטב סויה', 'fish': 'דג', 'chicken': 'עוף', 'beef': 'בקר',
    'spices': 'תבלינים', 'herbs': 'עשבי תיבול', 'seasoning': 'תיבול',
    'baking powder': 'אבקת אפייה', 'yeast extract': 'תמצית שמרים',
    'maltodextrin': 'מלטודקסטרין', 'inulin': 'אינולין',
    'sunflower lecithin': 'לציטין חמניות', 'rapeseed oil': 'שמן לפת',
    'rice flour': 'קמח אורז', 'potato starch': 'עמילן תפוחי אדמה',
    'tapioca starch': 'עמילן טפיוקה', 'wheat starch': 'עמילן חיטה',
    'brown sugar': 'סוכר חום', 'powdered sugar': 'אבקת סוכר',
    'maple syrup': 'סירופ מייפל', 'molasses': 'דבש תמרים',
    'apple': 'תפוח', 'banana': 'בננה', 'strawberry': 'תות',
    'mango': 'מנגו', 'pineapple': 'אננס', 'grape': 'ענב',
    'sodium hydroxide': 'נתרן הידרוקסיד', 'calcium chloride': 'סידן כלורי',
    'folic acid': 'חומצת פולית', 'niacin': 'ניאצין',
    'thiamine': 'תיאמין', 'riboflavin': 'ריבופלבין',
};

// Reverse map: Hebrew → English for matching Hebrew input against DB
const HEBREW_TO_ENGLISH = {};
for (const [en, he] of Object.entries(HEBREW_INGREDIENT_NAMES)) {
    HEBREW_TO_ENGLISH[he] = en;
}

// Modifiers to strip when ingredient name doesn't match DB directly
const MODIFIER_PREFIXES = [
    'refined', 'enriched', 'fortified', 'organic', 'natural', 'pure',
    'dried', 'powdered', 'dehydrated', 'concentrated', 'hydrogenated',
    'partially hydrogenated', 'hydrolyzed', 'bleached', 'unbleached',
    'toasted', 'roasted', 'ground', 'whole', 'instant', 'processed',
    'fermented', 'cultured', 'distilled', 'raw', 'virgin', 'extra virgin',
    'cold pressed', 'expeller pressed', 'food grade',
];
const MODIFIER_SUFFIXES = [
    'powder', 'extract', 'concentrate', 'paste', 'fiber', 'isolate',
    'flakes', 'bits', 'pieces', 'chips', 'granules', 'crystals',
];

/**
 * Strip common modifiers from ingredient name to find base form.
 * "Refined Palm Oil" → "palm oil", "Honey Powder" → "honey"
 * Returns array of possible stripped forms (may be empty).
 */
function stripModifiers(name) {
    const lower = name.toLowerCase().trim();
    const variants = [];

    // Strip prefixes
    for (const prefix of MODIFIER_PREFIXES) {
        if (lower.startsWith(prefix + ' ')) {
            const stripped = lower.slice(prefix.length).trim();
            if (stripped.length > 2) variants.push(stripped);
        }
    }

    // Strip suffixes
    for (const suffix of MODIFIER_SUFFIXES) {
        if (lower.endsWith(' ' + suffix)) {
            const stripped = lower.slice(0, -(suffix.length + 1)).trim();
            if (stripped.length > 2) variants.push(stripped);
        }
    }

    // Strip both prefix AND suffix (e.g., "Refined Canola Oil Extract")
    for (const prefix of MODIFIER_PREFIXES) {
        if (lower.startsWith(prefix + ' ')) {
            const afterPrefix = lower.slice(prefix.length).trim();
            for (const suffix of MODIFIER_SUFFIXES) {
                if (afterPrefix.endsWith(' ' + suffix)) {
                    const stripped = afterPrefix.slice(0, -(suffix.length + 1)).trim();
                    if (stripped.length > 2) variants.push(stripped);
                }
            }
        }
    }

    return [...new Set(variants)];
}

const FOOD_FIELDS = [
    'common_name', 'chemical_name', 'e_number', 'category',
    'function_desc', 'eu_status', 'us_status', 'health_concerns', 'health_concerns_he',
    'allergen_flag', 'pregnancy_safe', 'children_safe',
    'vegan', 'halal', 'kosher', 'adi_value', 'adi_unit', 'hebrew_name', 'category_he',
    'banned_countries', 'hyperactivity_link', 'iarc_group', 'israeli_products'
];

/**
 * Score a food ingredient based on safety data.
 * Returns 0-100 (higher = safer).
 */
function scoreFoodIngredient(row, ilStatus) {
    let score = 75; // Default: assumed OK

    const concerns = (row.health_concerns || '').toLowerCase();

    // Check for negated safety phrases FIRST (e.g., "No known toxicity", "No safety concern")
    const isNegatedSafe = /\bno\s+(known\s+)?toxicity\b/.test(concerns)
        || /\bno\s+safety\s+concern\b/.test(concerns)
        || /\bnon[\s-]?toxic\b/.test(concerns)
        || /\bno\s+known\s+(adverse|harmful)\b/.test(concerns);

    // Major red flags (skip if negated)
    if (!isNegatedSafe && (concerns.includes('carcinogen') || concerns.includes('banned') || concerns.includes('toxic'))) {
        score = 15;
    } else if (!isNegatedSafe && (concerns.includes('hyperactiv') || concerns.includes('hormone') || concerns.includes('endocrine'))) {
        score = 25;
    } else if (!isNegatedSafe && (concerns.includes('controversial') || concerns.includes('limit') || concerns.includes('concern') || concerns.includes('risk'))) {
        score = 45;
    } else if (isNegatedSafe || concerns.includes('generally recognized') || concerns.includes('safe') || concerns === '' || !concerns) {
        score = 85;
    }

    // ADI-based adjustment
    if (row.adi_value && row.adi_value !== 'N/A') {
        const adi = parseFloat(row.adi_value);
        if (!isNaN(adi)) {
            if (adi > 25) score = Math.max(score, 80);       // Very high ADI = safer
            else if (adi >= 5) score = Math.min(score, 70);   // Moderate ADI
            else if (adi >= 0.5) score = Math.min(score, 55); // Low ADI
            else if (adi > 0) score = Math.min(score, 35);    // Very low ADI = concern
        }
    }

    // Israeli regulatory adjustment
    if (ilStatus) {
        if (ilStatus.status === 'banned') score = Math.min(score, 10);
        else if (ilStatus.status === 'restricted') score = Math.min(score, 35);
    }

    // EU status adjustment
    const eu = (row.eu_status || '').toLowerCase();
    if (eu.includes('banned') || eu.includes('prohibited')) score = Math.min(score, 15);
    else if (eu.includes('restricted') || eu.includes('limited')) score = Math.min(score, 45);

    // Children safety concern
    if ((row.children_safe || '').toLowerCase() === 'no') score = Math.min(score, 40);

    return Math.max(0, Math.min(100, Math.round(score)));
}

function getLevel(score) {
    if (score >= 70) return 'green';
    if (score >= 40) return 'yellow';
    return 'red';
}

/**
 * Convert a food_additives row to HealthyScan result format.
 */
function foodRowToResult(row, score, ilStatus) {
    const level = getLevel(score);
    return {
        name: row.common_name || row.substance_name || '',
        name_he: row.hebrew_name || '',
        name_ru: '',
        e_number: row.e_number || null,
        score: score,
        level: level,
        category: row.category || row.function_desc || '',
        category_he: row.category_he || '',
        function_en: row.function_desc || row.category || '',
        function_he: row.category_he || '',
        health_concerns: row.health_concerns || '',
        health_concerns_he: row.health_concerns_he || '',
        adi: row.adi_value && row.adi_value !== 'N/A'
            ? (row.adi_value + ' ' + (row.adi_unit || 'mg/kg bw')).trim()
            : null,
        regulation: ilStatus ? ilStatus.status : 'unknown',
        regulation_notes: ilStatus ? ilStatus.notes : '',
        children_safe: row.children_safe || null,
        pregnancy_safe: row.pregnancy_safe || null,
        allergen: row.allergen_flag || null,
        banned_countries: row.banned_countries || null,
        hyperactivity: row.hyperactivity_link || null,
        iarc_group: row.iarc_group || null,
        common_foods: row.israeli_products || null,
        _source: 'food',
    };
}

/**
 * Resolve food aliases.
 */
async function resolveAliases(names, db) {
    const aliasMap = new Map();
    for (let i = 0; i < names.length; i += BATCH_SIZE) {
        const batch = names.slice(i, i + BATCH_SIZE);
        const ph = batch.map(() => '?').join(',');

        // food_aliases
        try {
            const result = await db.prepare(
                `SELECT LOWER(alias_name) as alias, canonical_name FROM food_aliases WHERE LOWER(alias_name) IN (${ph})`
            ).bind(...batch).all();
            for (const row of (result.results || [])) {
                aliasMap.set(row.alias, row.canonical_name.toLowerCase());
            }
        } catch (e) {}

        // ingredient_aliases (some food items may be in cosmetic alias table)
        try {
            const result = await db.prepare(
                `SELECT LOWER(alias_name) as alias, inci_name FROM ingredient_aliases WHERE LOWER(alias_name) IN (${ph})`
            ).bind(...batch).all();
            for (const row of (result.results || [])) {
                if (!aliasMap.has(row.alias)) {
                    aliasMap.set(row.alias, row.inci_name.toLowerCase());
                }
            }
        } catch (e) {}
    }
    return aliasMap;
}

/**
 * Look up Israeli regulatory status for E-numbers.
 */
async function getILStatus(eNumbers, db) {
    const ilMap = new Map();
    if (eNumbers.length === 0) return ilMap;

    for (let i = 0; i < eNumbers.length; i += BATCH_SIZE) {
        const batch = eNumbers.slice(i, i + BATCH_SIZE);
        const ph = batch.map(() => '?').join(',');
        try {
            const result = await db.prepare(
                `SELECT e_number, name_en, status, notes FROM il_permitted_additives WHERE e_number IN (${ph})`
            ).bind(...batch).all();
            for (const row of (result.results || [])) {
                ilMap.set(row.e_number.toUpperCase(), {
                    status: row.status || 'permitted',
                    notes: row.notes || '',
                    name: row.name_en || '',
                });
            }
        } catch (e) {}
    }
    return ilMap;
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
        // Rate limiting
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

        const names = body.ingredients;
        if (!Array.isArray(names) || names.length === 0) {
            return Response.json(
                { error: 'Request body must include "ingredients" array' },
                { status: 400, headers }
            );
        }

        const cleanNames = names
            .slice(0, MAX_INGREDIENTS)
            .map(n => (typeof n === 'string' ? n.trim() : ''))
            .filter(n => n.length > 0 && n.length < 200);

        if (cleanNames.length === 0) {
            return Response.json({ results: [], score: 50 }, { headers });
        }

        const lowerNames = cleanNames.map(n => n.toLowerCase());

        // ============================================================
        // FOOD MATCHING ENGINE
        // ============================================================

        const allMatches = new Map(); // lowercased name → result object
        const eNumbersFound = new Set();

        // Step 0: Resolve aliases + strip parenthetical E-numbers
        const aliasMap = await resolveAliases(lowerNames, env.DB);
        const resolvedNames = lowerNames.map(n => aliasMap.get(n) || n);

        // Also generate stripped names: "citric acid (e330)" → "citric acid" + "e330"
        // Handles both closed (xxx) and unclosed (xxx parentheticals from comma-split Hebrew labels
        const extraLookups = [];
        for (const name of lowerNames) {
            // Strip closed parenthetical: "citric acid (e330)" → "citric acid"
            const stripped = name.replace(/\s*\([^)]*\)\s*/g, '').trim();
            if (stripped && stripped !== name) extraLookups.push(stripped);
            // Strip unclosed parenthetical at end: "חומר משמר (סורבט" → "חומר משמר"
            const strippedUnclosed = name.replace(/\s*\([^)]*$/g, '').trim();
            if (strippedUnclosed && strippedUnclosed !== name && strippedUnclosed !== stripped) extraLookups.push(strippedUnclosed);
            // Extract content from parenthetical as separate lookup
            const parenContent = name.match(/\(([^)]+)\)?/);
            if (parenContent) {
                const inner = parenContent[1].trim().toLowerCase();
                if (inner.length > 2) extraLookups.push(inner);
            }
            // Also try unclosed paren content: "חומר משמר (סורבט" → "סורבט"
            const unclosedContent = name.match(/\(([^)]+)$/);
            if (unclosedContent) {
                const inner = unclosedContent[1].trim().toLowerCase();
                if (inner.length > 2) extraLookups.push(inner);
            }
            // Extract E-number: "citric acid (e330)" → "e330", also handles "e-1442"
            const eMatch = name.match(/e[-\s]?(\d{3,4}[a-z]?)/i);
            if (eMatch) extraLookups.push('e' + eMatch[1].toLowerCase());
            // Reversed E-number: "407e", "451e(" → "e407", "e451"
            const eReversed = name.match(/(\d{3,4})\s*e(?:\b|[^a-z]|$)/i);
            if (eReversed) extraLookups.push('e' + eReversed[1]);
            // Split E-number: "e3 27" → "e327"
            const eSplit = name.match(/e(\d)\s+(\d{2,3})/i);
            if (eSplit) extraLookups.push('e' + eSplit[1] + eSplit[2]);
            // Strip leading quotes/junk: '"מים' → 'מים'
            const cleanJunk = name.replace(/^["'\s]+/, '').trim();
            if (cleanJunk && cleanJunk !== name) extraLookups.push(cleanJunk);
            // Strip trailing closing parens: 'שום)' → 'שום'
            const cleanTrail = name.replace(/[)}\]]+\s*$/, '').trim();
            if (cleanTrail && cleanTrail !== name) extraLookups.push(cleanTrail);
            // Strip BOTH leading open + trailing close parens: '(E445)' → 'E445', '(מלח)' → 'מלח'
            const cleanBoth = name.replace(/^[(\[{]+\s*/, '').replace(/[)}\]]+\s*$/, '').trim();
            if (cleanBoth && cleanBoth !== name && cleanBoth !== cleanTrail) extraLookups.push(cleanBoth);
            // Strip trailing periods: 'שומשום.' → 'שומשום'
            const cleanDot = name.replace(/\.+\s*$/, '').trim();
            if (cleanDot && cleanDot !== name) extraLookups.push(cleanDot);
            // Strip leading 'n' artifact (newline remnant): 'nמלח' → 'מלח'
            const cleanN = name.replace(/^n(?=[^\x00-\x7F])/, '').trim();
            if (cleanN && cleanN !== name) extraLookups.push(cleanN);
            // Strip 'מכיל/מכילים' prefix from paren content: 'מכיל גלוטן' → 'גלוטן'
            const stripContains = name.replace(/^מכיל[ים]*\s+/, '').trim();
            if (stripContains && stripContains !== name) extraLookups.push(stripContains);
            // Strip percentage: "מיץ ענבים עשוי מרכז (6%)" → "מיץ ענבים עשוי מרכז"
            const stripPct = name.replace(/\s*\(\d+\.?\d*%?\)\s*/g, '').replace(/\s*\d+\.?\d*%\s*/g, '').trim();
            if (stripPct && stripPct !== name && stripPct.length > 2) extraLookups.push(stripPct);
            // Strip "עשוי מרכז" (from concentrate): "מיץ ענבים עשוי מרכז" → "מיץ ענבים"
            const stripConcentrate = stripPct.replace(/\s*עשוי מרכז\s*/g, '').trim();
            if (stripConcentrate && stripConcentrate !== stripPct && stripConcentrate.length > 2) extraLookups.push(stripConcentrate);
            // Strip "רכז" prefix: "רכז גזר שחור" → "גזר שחור"
            const stripRekez = name.replace(/^רכז\s+/, '').trim();
            if (stripRekez && stripRekez !== name && stripRekez.length > 2) extraLookups.push(stripRekez);
            // Strip functional category prefix: "Acidity Regulators: Citric Acid" → "citric acid"
            // Also splits Hebrew colon categories into individual ingredients:
            // "מווסתי חומציות: חומצה ציטרית ותלת נתרן ציטראט" → ["חומצה ציטרית", "תלת נתרן ציטראט"]
            const colonIdx = name.indexOf(':');
            if (colonIdx > 0 && colonIdx < name.length - 2) {
                const afterColon = name.substring(colonIdx + 1).trim().toLowerCase();
                if (afterColon.length > 2) extraLookups.push(afterColon);
                // Split on Hebrew "ו" (and) connector or commas for multi-ingredient colon groups
                const subIngredients = afterColon.split(/\s*[,،]\s*|\s+ו(?=[^\s])/);
                for (const sub of subIngredients) {
                    const trimmed = sub.trim();
                    if (trimmed.length > 2 && trimmed !== afterColon) extraLookups.push(trimmed);
                }
            }
            // Strip common modifiers: "Refined Palm Oil" → "palm oil", "Honey Powder" → "honey"
            const modStripped = stripModifiers(name);
            for (const ms of modStripped) {
                if (!extraLookups.includes(ms)) extraLookups.push(ms);
            }
            // Reverse Hebrew→English: "אבקת חלב דל שומן" → "skim milk powder"
            const heToEn = HEBREW_TO_ENGLISH[name] || HEBREW_TO_ENGLISH[stripPct] || HEBREW_TO_ENGLISH[stripConcentrate];
            if (heToEn && !extraLookups.includes(heToEn)) extraLookups.push(heToEn);
        }
        // Also resolve aliases for extraLookups (cleaned/stripped variants need alias resolution too)
        const extraAliasMap = extraLookups.length > 0 ? await resolveAliases(extraLookups, env.DB) : new Map();
        const resolvedExtras = extraLookups.map(n => extraAliasMap.get(n)).filter(Boolean);
        const allLookups = [...new Set([...lowerNames, ...resolvedNames, ...extraLookups, ...resolvedExtras])];

        // Step 1: food_additives by common_name / e_number / hebrew_name
        // Split into 3 separate queries to stay under D1's 100 bind-param limit
        const _addFoodRow = (row) => {
            if (row.e_number) eNumbersFound.add(row.e_number.toUpperCase().replace(/\s+/g, ''));
            allMatches.set(row.common_name.toLowerCase(), { _raw: row, _type: 'food_additive' });
            if (row.e_number) allMatches.set(row.e_number.toLowerCase().replace(/\s+/g, ''), { _raw: row, _type: 'food_additive' });
            if (row.hebrew_name) allMatches.set(row.hebrew_name.toLowerCase(), { _raw: row, _type: 'food_additive' });
        };
        const fields = FOOD_FIELDS.join(', ');
        for (let i = 0; i < allLookups.length; i += BATCH_SIZE) {
            const batch = allLookups.slice(i, i + BATCH_SIZE);
            const ph = batch.map(() => '?').join(',');
            // Query 1a: by common_name
            try {
                const r = await env.DB.prepare(
                    `SELECT ${fields} FROM food_additives WHERE LOWER(common_name) IN (${ph})`
                ).bind(...batch).all();
                for (const row of (r.results || [])) _addFoodRow(row);
            } catch (e) { console.error('Step1a:', e.message); }
            // Query 1b: by e_number
            const upperBatch = batch.map(n => n.toUpperCase().replace(/\s+/g, ''));
            const uph = upperBatch.map(() => '?').join(',');
            try {
                const r = await env.DB.prepare(
                    `SELECT ${fields} FROM food_additives WHERE UPPER(REPLACE(e_number, ' ', '')) IN (${uph})`
                ).bind(...upperBatch).all();
                for (const row of (r.results || [])) _addFoodRow(row);
            } catch (e) { console.error('Step1b:', e.message); }
            // Query 1c: by hebrew_name
            try {
                const r = await env.DB.prepare(
                    `SELECT ${fields} FROM food_additives WHERE LOWER(hebrew_name) IN (${ph})`
                ).bind(...batch).all();
                for (const row of (r.results || [])) _addFoodRow(row);
            } catch (e) { console.error('Step1c:', e.message); }
        }

        // Step 2: e_number_aliases
        const eNumUnmatched = allLookups.filter(n => !allMatches.has(n) && /^e\s*\d/i.test(n));
        if (eNumUnmatched.length > 0) {
            const eNums = eNumUnmatched.map(n => n.toUpperCase().replace(/\s+/g, ''));
            const eph = eNums.map(() => '?').join(',');
            try {
                const result = await env.DB.prepare(
                    `SELECT e_number, alias_name FROM e_number_aliases WHERE UPPER(REPLACE(e_number, ' ', '')) IN (${eph})`
                ).bind(...eNums).all();
                for (const row of (result.results || [])) {
                    const foodRow = await env.DB.prepare(
                        `SELECT ${FOOD_FIELDS.join(', ')} FROM food_additives WHERE LOWER(common_name) = ? LIMIT 1`
                    ).bind(row.alias_name.toLowerCase()).first();
                    if (foodRow) {
                        const eKey = row.e_number.toLowerCase().replace(/\s+/g, '');
                        eNumbersFound.add(row.e_number.toUpperCase().replace(/\s+/g, ''));
                        allMatches.set(eKey, { _raw: foodRow, _type: 'food_additive' });
                    }
                }
            } catch (e) {}
        }

        // Step 3: food_substances
        const substanceUnmatched = allLookups.filter(n => !allMatches.has(n));
        if (substanceUnmatched.length > 0) {
            for (let i = 0; i < substanceUnmatched.length; i += BATCH_SIZE) {
                const batch = substanceUnmatched.slice(i, i + BATCH_SIZE);
                const ph = batch.map(() => '?').join(',');
                try {
                    const result = await env.DB.prepare(
                        `SELECT substance_name, cas_number, adi_value, adi_unit, noael_value, noael_unit, genotoxicity
                         FROM food_substances WHERE LOWER(substance_name) IN (${ph})`
                    ).bind(...batch).all();
                    for (const row of (result.results || [])) {
                        allMatches.set(row.substance_name.toLowerCase(), { _raw: row, _type: 'food_substance' });
                    }
                } catch (e) {}
            }
        }

        // Step 4: food_synonyms → food_substances
        const synUnmatched = allLookups.filter(n => !allMatches.has(n));
        if (synUnmatched.length > 0) {
            for (let i = 0; i < synUnmatched.length; i += BATCH_SIZE) {
                const batch = synUnmatched.slice(i, i + BATCH_SIZE);
                const ph = batch.map(() => '?').join(',');
                try {
                    const result = await env.DB.prepare(
                        `SELECT synonym, substance_name FROM food_synonyms WHERE LOWER(synonym) IN (${ph})`
                    ).bind(...batch).all();
                    for (const row of (result.results || [])) {
                        const subResult = await env.DB.prepare(
                            `SELECT substance_name, cas_number, adi_value, adi_unit, noael_value, noael_unit, genotoxicity
                             FROM food_substances WHERE substance_name = ? LIMIT 1`
                        ).bind(row.substance_name).first();
                        if (subResult) {
                            allMatches.set(row.synonym.toLowerCase(), { _raw: subResult, _type: 'food_synonym' });
                        }
                    }
                } catch (e) {}
            }
        }

        // Also extract E-numbers from ingredient names like "Citric Acid (E330)"
        for (const name of cleanNames) {
            const eMatch = name.match(/E\s?(\d{3,4}[a-z]?)/i);
            if (eMatch) {
                eNumbersFound.add(('E' + eMatch[1]).toUpperCase());
            }
        }

        // Step 5: Israeli regulatory status for all found E-numbers
        const ilStatusMap = await getILStatus([...eNumbersFound], env.DB);

        // ============================================================
        // BUILD RESULTS
        // ============================================================

        const results = [];
        for (let i = 0; i < lowerNames.length; i++) {
            const original = cleanNames[i];
            const lower = lowerNames[i];
            const resolved = resolvedNames[i];

            // Try: exact → resolved alias → stripped (no parenthetical) → E-number → cleaned variants
            const stripped = lower.replace(/\s*\([^)]*\)\s*/g, '').trim();
            const strippedUnclosed = lower.replace(/\s*\([^)]*$/g, '').trim();
            const eExtracted = extractENumber(original);
            const eKey = eExtracted ? eExtracted.toLowerCase() : null;
            // Text cleaning variants
            const dotStripped = lower.replace(/\.+\s*$/, '').trim();
            const nStripped = lower.replace(/^n(?=[^\x00-\x7F])/, '').trim();
            const eReversedMatch = lower.match(/(\d{3,4})\s*e(?:\b|[^a-z]|$)/i);
            const eReversedKey = eReversedMatch ? 'e' + eReversedMatch[1] : null;
            const eSplitMatch = lower.match(/e(\d)\s+(\d{2,3})/i);
            const eSplitKey = eSplitMatch ? 'e' + eSplitMatch[1] + eSplitMatch[2] : null;
            const eHyphenMatch = lower.match(/e-(\d{3,4}[a-z]?)/i);
            const eHyphenKey = eHyphenMatch ? 'e' + eHyphenMatch[1] : null;
            // Strip trailing close-parens/brackets: 'אססולפאם K)' → 'אססולפאם k'
            const trailStripped = lower.replace(/[)}\]]+\s*$/, '').trim();
            // Strip leading open-parens/brackets: '(E445)' stripped → try content, '(מלח' → 'מלח'
            const leadStripped = lower.replace(/^[(\[{]+\s*/, '').replace(/[)}\]]+\s*$/, '').trim();
            // Extract paren content as lookup
            const parenContentMatch = lower.match(/\(([^)]+)\)?/);
            const parenKey = parenContentMatch ? parenContentMatch[1].trim() : null;
            const unclosedParenMatch = lower.match(/\(([^)]+)$/);
            const unclosedKey = unclosedParenMatch ? unclosedParenMatch[1].trim() : null;
            // After-colon: "Acidity Regulators: Citric Acid" → "citric acid"
            const colonStripped = lower.indexOf(':') > 0 ? lower.substring(lower.indexOf(':') + 1).trim() : null;
            // Colon sub-ingredients: split "חומצה ציטרית ותלת נתרן ציטראט" → try each part
            const colonSubs = [];
            if (colonStripped) {
                const parts = colonStripped.split(/\s*[,،]\s*|\s+ו(?=[^\s])/);
                for (const p of parts) { const t = p.trim(); if (t.length > 2) colonSubs.push(t); }
            }
            const colonSubMatch = colonSubs.reduce((found, sub) => found || allMatches.get(sub) || allMatches.get(extraAliasMap.get(sub) || ''), null);
            // Percentage-stripped: "מיץ ענבים עשוי מרכז (6%)" → "מיץ ענבים עשוי מרכז"
            const pctStripped = lower.replace(/\s*\(\d+\.?\d*%?\)\s*/g, '').replace(/\s*\d+\.?\d*%\s*/g, '').trim();
            const pctAlias = pctStripped !== lower ? (extraAliasMap.get(pctStripped) || null) : null;
            // Concentrate-stripped: "מיץ ענבים עשוי מרכז" → "מיץ ענבים"
            const concStripped = pctStripped.replace(/\s*עשוי מרכז\s*/g, '').trim();
            const concAlias = concStripped !== pctStripped ? (extraAliasMap.get(concStripped) || null) : null;
            // Rekez-stripped: "רכז גזר שחור" → "גזר שחור"
            const rekezStripped = lower.startsWith('רכז ') ? lower.substring(4).trim() : null;
            const rekezAlias = rekezStripped ? (extraAliasMap.get(rekezStripped) || null) : null;
            // Try resolved aliases for cleaned variants
            const strippedAlias = extraAliasMap.get(stripped) || null;
            const strippedUnclosedAlias = extraAliasMap.get(strippedUnclosed) || null;
            const trailAlias = extraAliasMap.get(trailStripped) || null;
            const leadAlias = extraAliasMap.get(leadStripped) || null;
            const dotAlias = extraAliasMap.get(dotStripped) || null;
            const nAlias = extraAliasMap.get(nStripped) || null;
            const parenAlias = parenKey ? (extraAliasMap.get(parenKey) || null) : null;
            const unclosedAlias = unclosedKey ? (extraAliasMap.get(unclosedKey) || null) : null;
            const colonAlias = colonStripped ? (extraAliasMap.get(colonStripped) || null) : null;
            // Prefer resolved alias (food_additive) over direct match (may be food_synonym/substance)
            const directMatch = allMatches.get(lower);
            const resolvedMatch = resolved !== lower ? allMatches.get(resolved) : null;
            // Try modifier-stripped variants against DB matches
            const modVariants = stripModifiers(lower);
            let modMatch = null;
            for (const mv of modVariants) {
                modMatch = allMatches.get(mv) || allMatches.get(extraAliasMap.get(mv) || '');
                if (modMatch) break;
            }

            const match = (resolvedMatch && resolvedMatch._type === 'food_additive' ? resolvedMatch : null)
                || directMatch
                || resolvedMatch
                || (stripped !== lower ? allMatches.get(stripped) : null)
                || (strippedAlias ? allMatches.get(strippedAlias) : null)
                || (strippedUnclosed !== lower && strippedUnclosed !== stripped ? allMatches.get(strippedUnclosed) : null)
                || (strippedUnclosedAlias ? allMatches.get(strippedUnclosedAlias) : null)
                || (trailStripped !== lower ? allMatches.get(trailStripped) : null)
                || (trailAlias ? allMatches.get(trailAlias) : null)
                || (leadStripped !== lower && leadStripped !== trailStripped ? allMatches.get(leadStripped) : null)
                || (leadAlias ? allMatches.get(leadAlias) : null)
                || (eKey ? allMatches.get(eKey) : null)
                || (dotStripped !== lower ? allMatches.get(dotStripped) : null)
                || (dotAlias ? allMatches.get(dotAlias) : null)
                || (nStripped !== lower ? allMatches.get(nStripped) : null)
                || (nAlias ? allMatches.get(nAlias) : null)
                || (eReversedKey ? allMatches.get(eReversedKey) : null)
                || (eSplitKey ? allMatches.get(eSplitKey) : null)
                || (eHyphenKey ? allMatches.get(eHyphenKey) : null)
                || (parenKey && parenKey.length > 2 ? allMatches.get(parenKey) : null)
                || (parenAlias ? allMatches.get(parenAlias) : null)
                || (unclosedKey && unclosedKey.length > 2 ? allMatches.get(unclosedKey) : null)
                || (unclosedAlias ? allMatches.get(unclosedAlias) : null)
                || (colonStripped && colonStripped.length > 2 ? allMatches.get(colonStripped) : null)
                || (colonAlias ? allMatches.get(colonAlias) : null)
                || colonSubMatch
                || (pctStripped !== lower ? allMatches.get(pctStripped) : null)
                || (pctAlias ? allMatches.get(pctAlias) : null)
                || (concStripped !== pctStripped && concStripped.length > 2 ? allMatches.get(concStripped) : null)
                || (concAlias ? allMatches.get(concAlias) : null)
                || (rekezStripped && rekezStripped.length > 2 ? allMatches.get(rekezStripped) : null)
                || (rekezAlias ? allMatches.get(rekezAlias) : null)
                || modMatch;

            if (!match) {
                // Last resort: check if name (or stripped form) is a known common food ingredient
                // Also check after-colon ("Antioxidant: Ascorbic Acid" → "ascorbic acid")
                // Check English-keyed map (input is English) AND Hebrew-keyed reverse map (input is Hebrew)
                const knownFoodKey = HEBREW_INGREDIENT_NAMES[lower]
                    || HEBREW_TO_ENGLISH[lower]
                    || (pctStripped !== lower ? (HEBREW_INGREDIENT_NAMES[pctStripped] || HEBREW_TO_ENGLISH[pctStripped]) : null)
                    || (concStripped !== pctStripped ? (HEBREW_INGREDIENT_NAMES[concStripped] || HEBREW_TO_ENGLISH[concStripped]) : null)
                    || (rekezStripped ? (HEBREW_INGREDIENT_NAMES[rekezStripped] || HEBREW_TO_ENGLISH[rekezStripped]) : null)
                    || (colonStripped ? (HEBREW_INGREDIENT_NAMES[colonStripped] || HEBREW_TO_ENGLISH[colonStripped]) : null)
                    || colonSubs.reduce((found, sub) => found || HEBREW_INGREDIENT_NAMES[sub] || HEBREW_TO_ENGLISH[sub], null)
                    || modVariants.reduce((found, mv) => found || HEBREW_INGREDIENT_NAMES[mv] || HEBREW_TO_ENGLISH[mv], null);

                if (knownFoodKey) {
                    // Known safe food — return with score 75 (assumed OK, basic food)
                    // Determine Hebrew name: if input was Hebrew, use it; if English, look up Hebrew
                    const heName = HEBREW_TO_ENGLISH[lower] ? lower
                        : (HEBREW_TO_ENGLISH[pctStripped] ? pctStripped
                        : (HEBREW_TO_ENGLISH[concStripped] ? concStripped
                        : (HEBREW_INGREDIENT_NAMES[lower] || knownFoodKey)));
                    // Clean display name: strip percentages and stray parens
                    const cleanName = original.replace(/\s*\(\d+\.?\d*%?\)\s*/g, '').replace(/\s*\d+\.?\d*%\s*/g, '').replace(/[()]/g, '').trim();
                    const cleanHe = heName.replace(/[()]/g, '').trim();
                    results.push({
                        name: cleanName,
                        name_he: cleanHe,
                        name_ru: '',
                        e_number: extractENumber(original),
                        score: 75,
                        level: 'green',
                        category: 'מרכיב בסיסי',
                        category_he: 'מרכיב בסיסי',
                        function_en: 'Basic food ingredient',
                        function_he: 'מרכיב בסיסי',
                        health_concerns: '',
                        health_concerns_he: '',
                        adi: null,
                        regulation: 'permitted',
                        regulation_notes: '',
                        children_safe: null,
                        allergen: null,
                        _source: 'known_food',
                    });
                    continue;
                }

                // Truly unmatched — return as unknown
                results.push({
                    name: original,
                    e_number: extractENumber(original),
                    score: null,
                    level: 'gray',
                    category: '',
                    function_en: '',
                    function_he: '',
                    name_ru: '',
                    health_concerns: '',
                    health_concerns_he: '',
                    adi: null,
                    regulation: 'unknown',
                    regulation_notes: '',
                    children_safe: null,
                    allergen: null,
                    _source: null,
                });
                continue;
            }

            const raw = match._raw;
            const type = match._type;

            // Get E-number for IL status lookup
            let eNum = raw.e_number || null;
            if (!eNum) {
                const eMatch = original.match(/E\s?(\d{3,4}[a-z]?)/i);
                if (eMatch) eNum = 'E' + eMatch[1].toUpperCase();
            }
            const ilStatus = eNum ? ilStatusMap.get(eNum.toUpperCase().replace(/\s+/g, '')) : null;

            if (type === 'food_additive') {
                const score = scoreFoodIngredient(raw, ilStatus);
                const result = foodRowToResult(raw, score, ilStatus);
                // Use DB's clean common_name when available (avoids OCR typos like "modifed Strach")
                // Fall back to original input only if DB has no name
                result.name = raw.common_name || original;
                results.push(result);
            } else if (type === 'food_substance' || type === 'food_synonym') {
                // food_substances have different fields
                const genoFlag = raw.genotoxicity === 'positive';
                let score = genoFlag ? 25 : 75;
                if (raw.adi_value) {
                    const adi = parseFloat(raw.adi_value);
                    if (!isNaN(adi) && adi < 0.5) score = Math.min(score, 35);
                    else if (!isNaN(adi) && adi < 5) score = Math.min(score, 55);
                }
                if (ilStatus && ilStatus.status === 'banned') score = Math.min(score, 10);
                if (ilStatus && ilStatus.status === 'restricted') score = Math.min(score, 35);

                results.push({
                    name: original,
                    name_he: raw.hebrew_name || '',
                    name_ru: '',
                    e_number: eNum,
                    score: Math.round(score),
                    level: getLevel(score),
                    category: '',
                    function_en: raw.adi_value && !isNaN(parseFloat(raw.adi_value)) ? 'ADI: ' + raw.adi_value + ' ' + (raw.adi_unit || 'mg/kg bw') : 'Evaluated by EFSA',
                    function_he: '',
                    health_concerns: genoFlag ? 'Genotoxicity concern flagged by EFSA' : '',
                    health_concerns_he: genoFlag ? 'חשש לרעילות גנטית סומן על ידי EFSA' : '',
                    adi: raw.adi_value ? (raw.adi_value + ' ' + (raw.adi_unit || 'mg/kg bw')).trim() : null,
                    regulation: ilStatus ? ilStatus.status : 'unknown',
                    regulation_notes: ilStatus ? ilStatus.notes : '',
                    children_safe: null,
                    allergen: null,
                    _source: type,
                });
            }
        }

        // Enrich Hebrew names from hebrew_foods table for results missing name_he
        const needHebrew = results.filter(r => !r.name_he && r.name);
        if (needHebrew.length > 0) {
            try {
                const nameLookup = needHebrew.map(r => r.name.toLowerCase());
                for (let i = 0; i < nameLookup.length; i += BATCH_SIZE) {
                    const batch = nameLookup.slice(i, i + BATCH_SIZE);
                    const ph = batch.map(() => '?').join(',');
                    const hebrewRows = await env.DB.prepare(
                        `SELECT LOWER(english_name) as en_lower, hebrew_name FROM hebrew_foods WHERE LOWER(english_name) IN (${ph})`
                    ).bind(...batch).all();
                    if (hebrewRows.results) {
                        const heMap = {};
                        for (const hr of hebrewRows.results) { heMap[hr.en_lower] = hr.hebrew_name; }
                        for (const r of needHebrew) {
                            if (!r.name_he && heMap[r.name.toLowerCase()]) r.name_he = heMap[r.name.toLowerCase()];
                        }
                    }
                }
            } catch (e) { /* hebrew_foods lookup is non-critical */ }
        }

        // Fallback: hebrew_english_dict (our 42K-entry Academy-sourced dictionary)
        const needHebrew2 = results.filter(r => !r.name_he && r.name);
        if (needHebrew2.length > 0) {
            try {
                const dictLookups = [...new Set(needHebrew2.map(r => r.name.toLowerCase()))];
                const dictMap = {};
                for (let i = 0; i < dictLookups.length; i += BATCH_SIZE) {
                    const batch = dictLookups.slice(i, i + BATCH_SIZE);
                    const ph = batch.map(() => '?').join(',');
                    const dictRows = await env.DB.prepare(
                        `SELECT LOWER(english) as en_lower, hebrew FROM hebrew_english_dict WHERE LOWER(english) IN (${ph}) AND confidence IN ('high','medium')`
                    ).bind(...batch).all();
                    for (const dr of (dictRows.results || [])) { dictMap[dr.en_lower] = dr.hebrew; }
                }
                for (const r of needHebrew2) {
                    if (dictMap[r.name.toLowerCase()]) r.name_he = dictMap[r.name.toLowerCase()];
                }
            } catch (e) { /* hebrew_english_dict lookup is non-critical */ }
        }

        // Final fallback: hardcoded common ingredient Hebrew names
        for (const r of results) {
            if (!r.name_he && r.name) {
                r.name_he = HEBREW_INGREDIENT_NAMES[r.name.toLowerCase()] || '';
            }
        }

        // Enrich Russian names from russian_english_dict
        const needRussian = results.filter(r => !r.name_ru && r.name);
        if (needRussian.length > 0) {
            try {
                const ruLookups = [...new Set(needRussian.map(r => r.name.toLowerCase()))];
                const ruMap = {};
                for (let i = 0; i < ruLookups.length; i += BATCH_SIZE) {
                    const batch = ruLookups.slice(i, i + BATCH_SIZE);
                    const ph = batch.map(() => '?').join(',');
                    const ruRows = await env.DB.prepare(
                        `SELECT LOWER(english) as en_lower, russian FROM russian_english_dict WHERE LOWER(english) IN (${ph})`
                    ).bind(...batch).all();
                    for (const rr of (ruRows.results || [])) { ruMap[rr.en_lower] = rr.russian; }
                }
                for (const r of needRussian) {
                    if (ruMap[r.name.toLowerCase()]) r.name_ru = ruMap[r.name.toLowerCase()];
                }
            } catch (e) { /* russian_english_dict lookup is non-critical */ }
        }

        // Calculate overall product score
        const scored = results.filter(r => r.score !== null);
        let overallScore = 50;
        if (scored.length > 0) {
            let total = 0, weight = 0;
            for (const r of scored) {
                const w = r.level === 'red' ? 3 : r.level === 'yellow' ? 2 : 1;
                total += r.score * w;
                weight += w;
            }
            overallScore = Math.round(total / weight);
        }

        return Response.json({
            score: overallScore,
            level: getLevel(overallScore),
            total: results.length,
            matched: scored.length,
            unmatched: results.length - scored.length,
            results: results,
        }, { headers });

    } catch (e) {
        console.error('Food-scan error:', e.message, e.stack);
        return Response.json(
            { error: 'Internal server error' },
            { status: 500, headers }
        );
    }
}

function extractENumber(name) {
    const match = name.match(/E\s?(\d{3,4}[a-z]?)/i);
    return match ? 'E' + match[1].toUpperCase() : null;
}