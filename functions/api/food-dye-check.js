/**
 * Cloudflare Pages Function: /api/food-dye-check
 *
 * POST — Food Dye Safety Checker
 * Two modes:
 *   1. { "query": "Red 40" }      → lookup single dye by name/E-number
 *   2. { "ingredients": "sugar, water, Red 40, citric acid" } → scan list for dyes
 *
 * Returns safety data from D1 food_additives (colorant category)
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
        headers: { ...getCorsHeaders(context.request), ...SECURITY_HEADERS },
    });
}

// ── Known synthetic dye aliases → canonical E-numbers ──────────
const DYE_ALIASES = {
    // Red dyes
    'red 2':        'E123', 'amaranth':        'E123', 'fd&c red 2': 'E123',
    'red 3':        'E127', 'erythrosine':     'E127', 'fd&c red 3': 'E127', 'erythrosine b': 'E127',
    'red 40':       'E129', 'allura red':      'E129', 'fd&c red 40': 'E129', 'allura red ac': 'E129',
    'red 2g':       'E128', 'fd&c red 2g':     'E128',
    'ponceau 4r':   'E124', 'red 7':           'E124',
    'carmoisine':   'E122', 'azorubine':       'E122',
    // Yellow dyes
    'yellow 5':     'E102', 'tartrazine':      'E102', 'fd&c yellow 5': 'E102',
    'yellow 6':     'E110', 'sunset yellow':   'E110', 'fd&c yellow 6': 'E110', 'sunset yellow fcf': 'E110',
    'quinoline yellow': 'E104',
    // Blue/Green dyes
    'blue 1':       'E133', 'brilliant blue':  'E133', 'fd&c blue 1': 'E133', 'brilliant blue fcf': 'E133',
    'blue 2':       'E132', 'indigotine':      'E132', 'fd&c blue 2': 'E132', 'indigo carmine': 'E132',
    'green 3':      'E143', 'fast green':      'E143', 'fd&c green 3': 'E143', 'fast green fcf': 'E143',
    // Others
    'patent blue v': 'E131',
    'brown ht':     'E155',
    'black pn':     'E151', 'brilliant black bn': 'E151',
    'litholrubine bk': 'E180',
    'yellow 2g':    'E107',
};

// Canonical dye data for the "big 7" US synthetic dyes + key banned ones
const CANONICAL_DYES = {
    'E127': { fdcName: 'FD&C Red 3', color: '#FF2B5B', type: 'synthetic', banned: true, bannedNote: 'FDA banned Jan 2025 (effective Jan 2027). Linked to thyroid tumors in rats.' },
    'E129': { fdcName: 'FD&C Red 40', color: '#FF4444', type: 'synthetic', phaseOut: true, phaseOutNote: 'FDA voluntary phase-out by end 2026. Most widely used red dye in the US.' },
    'E102': { fdcName: 'FD&C Yellow 5', color: '#FFD700', type: 'synthetic', phaseOut: true, phaseOutNote: 'FDA voluntary phase-out by end 2026. EU requires warning label.' },
    'E110': { fdcName: 'FD&C Yellow 6', color: '#FFA500', type: 'synthetic', phaseOut: true, phaseOutNote: 'FDA voluntary phase-out by end 2026. EU requires warning label.' },
    'E133': { fdcName: 'FD&C Blue 1', color: '#3366FF', type: 'synthetic', phaseOut: true, phaseOutNote: 'FDA voluntary phase-out by end 2026.' },
    'E132': { fdcName: 'FD&C Blue 2', color: '#4B0082', type: 'synthetic', phaseOut: true, phaseOutNote: 'FDA voluntary phase-out by end 2026.' },
    'E143': { fdcName: 'FD&C Green 3', color: '#00AA55', type: 'synthetic', phaseOut: true, phaseOutNote: 'FDA voluntary phase-out by end 2026.' },
    'E123': { fdcName: 'FD&C Red 2', color: '#990033', type: 'synthetic', banned: true, bannedNote: 'Banned in the US since 1976. Still permitted in some EU countries.' },
    'E124': { fdcName: 'Ponceau 4R', color: '#CC3333', type: 'synthetic', euWarning: true },
    'E122': { fdcName: 'Carmoisine', color: '#CC2244', type: 'synthetic', euWarning: true },
    'E104': { fdcName: 'Quinoline Yellow', color: '#CCCC00', type: 'synthetic', euWarning: true },
    'E128': { fdcName: 'Red 2G', color: '#CC4444', type: 'synthetic', banned: true, bannedNote: 'Banned in EU since 2007. Not approved in the US.' },
    'E107': { fdcName: 'Yellow 2G', color: '#CCAA00', type: 'synthetic', banned: true, bannedNote: 'Not approved in most countries.' },
    'E131': { fdcName: 'Patent Blue V', color: '#336699', type: 'synthetic', euOnly: true },
    'E151': { fdcName: 'Brilliant Black BN', color: '#333333', type: 'synthetic', euWarning: true },
    'E155': { fdcName: 'Brown HT', color: '#8B4513', type: 'synthetic', euWarning: true },
};

// Natural colorants — generally safe
const NATURAL_DYES = [
    'E100', 'E101', 'E120', 'E140', 'E141', 'E150a', 'E150b', 'E150c', 'E150d',
    'E153', 'E160a', 'E160b', 'E160c', 'E160d', 'E160e', 'E161b', 'E162', 'E163',
    'E170', 'E171', 'E172',
];

// ── Scoring ──────────────────────────────────────────────────
function scoreDye(eNumber, dbRow) {
    const canon = CANONICAL_DYES[eNumber];
    if (canon?.banned) return 10;
    if (canon?.phaseOut) return 35;
    if (canon?.euWarning) return 45;
    if (NATURAL_DYES.includes(eNumber)) {
        if (eNumber === 'E171') return 40; // TiO2 — banned in EU
        return 90;
    }
    // Fallback: check DB status
    if (dbRow) {
        const status = ((dbRow.us_status || '') + ' ' + (dbRow.eu_status || '')).toLowerCase();
        if (status.includes('banned') || status.includes('not approved')) return 15;
        if (status.includes('restrict') || status.includes('warning')) return 45;
        if (status.includes('approved')) return 75;
    }
    return 60; // unknown colorant
}

function verdictFromScore(score) {
    if (score >= 75) return 'safe';
    if (score >= 45) return 'caution';
    return 'concern';
}

// ── DB lookup ────────────────────────────────────────────────
async function lookupDye(db, query) {
    const q = query.trim();
    const qLower = q.toLowerCase();

    // 1. Check alias map
    const aliasE = DYE_ALIASES[qLower];

    // 2. Search D1 — by E-number, common_name, or alias match
    const searchTerms = [q];
    if (aliasE) searchTerms.push(aliasE);

    const placeholders = searchTerms.map(() => 'common_name LIKE ? OR e_number LIKE ?').join(' OR ');
    const params = [];
    for (const t of searchTerms) {
        params.push(`%${t}%`, `%${t}%`);
    }

    const rows = await db.prepare(
        `SELECT common_name, e_number, category, us_status, eu_status, health_concerns, hebrew_name
         FROM food_additives
         WHERE (${placeholders})
           AND (category LIKE '%color%' OR category LIKE '%dye%')
         LIMIT 20`
    ).bind(...params).all();

    return { rows: rows.results || [], aliasE };
}

async function scanIngredients(db, ingredientText) {
    // Build regex from all known aliases + common dye names
    const allTerms = Object.keys(DYE_ALIASES);
    // Also search for E-number patterns
    const eNumberPattern = /\bE\s*\d{3}[a-z]?\b/gi;
    const eMatches = ingredientText.match(eNumberPattern) || [];

    const found = [];
    const seen = new Set();
    const textLower = ingredientText.toLowerCase();

    // Check all aliases
    for (const [alias, eNum] of Object.entries(DYE_ALIASES)) {
        if (textLower.includes(alias) && !seen.has(eNum)) {
            seen.add(eNum);
            found.push({ matchedTerm: alias, eNumber: eNum });
        }
    }

    // Check E-number matches
    for (const eMatch of eMatches) {
        const normalized = eMatch.replace(/\s/g, '').toUpperCase();
        if (!seen.has(normalized)) {
            // Verify it's a colorant
            const row = await db.prepare(
                `SELECT common_name, e_number, category FROM food_additives
                 WHERE e_number LIKE ? AND (category LIKE '%color%' OR category LIKE '%dye%') LIMIT 1`
            ).bind(`%${normalized}%`).first();
            if (row) {
                seen.add(normalized);
                found.push({ matchedTerm: eMatch, eNumber: normalized });
            }
        }
    }

    return found;
}

// ── Main handler ─────────────────────────────────────────────
export async function onRequestPost(context) {
    const cors = getCorsHeaders(context.request);
    const headers = { ...cors, ...SECURITY_HEADERS, 'Content-Type': 'application/json' };

    try {
        const body = await context.request.json();
        const db = context.env.DB;
        const { query, ingredients } = body;

        if (!query && !ingredients) {
            return new Response(JSON.stringify({ error: 'Provide "query" (dye name) or "ingredients" (ingredient list)' }), { status: 400, headers });
        }

        if (ingredients && ingredients.length > 10000) {
            return new Response(JSON.stringify({ error: 'Ingredients text too long' }), { status: 413, headers });
        }
        if (query && query.length > 200) {
            return new Response(JSON.stringify({ error: 'Query too long' }), { status: 413, headers });
        }

        let results = [];

        if (query) {
            // ── Single dye lookup ──
            const { rows, aliasE } = await lookupDye(db, query);
            const eTarget = aliasE || null;

            for (const row of rows) {
                const eNum = (row.e_number || '').replace(/\s*\(.*\)/, '').trim();
                const canon = CANONICAL_DYES[eNum] || null;
                const score = scoreDye(eNum, row);
                results.push({
                    name: row.common_name,
                    eNumber: row.e_number || eNum,
                    hebrewName: row.hebrew_name || null,
                    fdcName: canon?.fdcName || null,
                    color: canon?.color || null,
                    type: canon?.type || (NATURAL_DYES.includes(eNum) ? 'natural' : 'unknown'),
                    fdaStatus: row.us_status || null,
                    euStatus: row.eu_status || null,
                    healthConcerns: row.health_concerns || null,
                    banned: canon?.banned || false,
                    bannedNote: canon?.bannedNote || null,
                    phaseOut: canon?.phaseOut || false,
                    phaseOutNote: canon?.phaseOutNote || null,
                    euWarning: canon?.euWarning || false,
                    score,
                    verdict: verdictFromScore(score),
                });
            }

            // Deduplicate by E-number (keep lowest score = most cautious)
            const byE = new Map();
            for (const r of results) {
                const key = r.eNumber || r.name;
                if (!byE.has(key) || r.score < byE.get(key).score) {
                    byE.set(key, r);
                }
            }
            results = Array.from(byE.values());

        } else {
            // ── Ingredient list scan ──
            const foundDyes = await scanIngredients(db, ingredients);

            for (const { matchedTerm, eNumber } of foundDyes) {
                const row = await db.prepare(
                    `SELECT common_name, e_number, category, us_status, eu_status, health_concerns, hebrew_name
                     FROM food_additives
                     WHERE e_number LIKE ? AND (category LIKE '%color%' OR category LIKE '%dye%')
                     LIMIT 1`
                ).bind(`%${eNumber}%`).first();

                const canon = CANONICAL_DYES[eNumber] || null;
                const score = scoreDye(eNumber, row);
                results.push({
                    name: row?.common_name || matchedTerm,
                    eNumber: row?.e_number || eNumber,
                    hebrewName: row?.hebrew_name || null,
                    fdcName: canon?.fdcName || null,
                    color: canon?.color || null,
                    type: canon?.type || (NATURAL_DYES.includes(eNumber) ? 'natural' : 'unknown'),
                    fdaStatus: row?.us_status || null,
                    euStatus: row?.eu_status || null,
                    healthConcerns: row?.health_concerns || null,
                    banned: canon?.banned || false,
                    bannedNote: canon?.bannedNote || null,
                    phaseOut: canon?.phaseOut || false,
                    phaseOutNote: canon?.phaseOutNote || null,
                    euWarning: canon?.euWarning || false,
                    score,
                    verdict: verdictFromScore(score),
                    matchedIn: matchedTerm,
                });
            }
        }

        // Sort: worst first
        results.sort((a, b) => a.score - b.score);

        const summary = {
            total: results.length,
            safe: results.filter(r => r.verdict === 'safe').length,
            caution: results.filter(r => r.verdict === 'caution').length,
            concern: results.filter(r => r.verdict === 'concern').length,
        };

        // Overall score
        let overallScore = 100;
        if (results.length > 0) {
            if (ingredients) {
                // Scan mode: product score based on worst dyes found
                for (const r of results) {
                    if (r.banned) overallScore -= 40;
                    else if (r.phaseOut) overallScore -= 25;
                    else if (r.euWarning) overallScore -= 15;
                    else if (r.verdict === 'caution') overallScore -= 10;
                }
                overallScore = Math.max(0, Math.min(100, overallScore));
            } else {
                // Search mode: score IS the dye's score
                overallScore = results[0]?.score || 60;
            }
        }

        return new Response(JSON.stringify({
            mode: query ? 'search' : 'scan',
            query: query || null,
            score: overallScore,
            results,
            summary,
        }), { headers });

    } catch (err) {
        return new Response(JSON.stringify({ error: 'Internal error: ' + err.message }), { status: 500, headers });
    }
}
