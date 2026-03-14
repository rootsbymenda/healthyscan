/**
 * build_russian_vocab.js
 *
 * Builds a Russian-English food ingredient vocabulary dictionary
 * from freely available open data sources (no scraping).
 *
 * Sources:
 *   1. OpenFoodFacts Ingredient Taxonomy (~1300+ entries)
 *   2. OpenFoodFacts Additives Taxonomy (~295 entries)
 *   3. Wikidata SPARQL — E-number additives (~350 entries)
 *   4. Wikidata SPARQL — Food ingredients (~474 entries)
 *
 * Output: scripts/sql/14-russian-english-dict.sql
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ─── Config ──────────────────────────────────────────────────────────────────

const OUTPUT_DIR = path.join(__dirname, 'sql');
const OUTPUT_FILE = path.join(OUTPUT_DIR, '14-russian-english-dict.sql');

const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';

const SPARQL_ENUMBERS = `
SELECT ?enLabel ?ruLabel ?enumber WHERE {
  ?item wdt:P628 ?enumber .
  ?item rdfs:label ?enLabel . FILTER(LANG(?enLabel) = "en")
  ?item rdfs:label ?ruLabel . FILTER(LANG(?ruLabel) = "ru")
} ORDER BY ?enumber
`.trim();

const SPARQL_FOOD_INGREDIENTS = `
SELECT ?enLabel ?ruLabel WHERE {
  ?item wdt:P31/wdt:P279* wd:Q25403900 .
  ?item rdfs:label ?enLabel . FILTER(LANG(?enLabel) = "en")
  ?item rdfs:label ?ruLabel . FILTER(LANG(?ruLabel) = "ru")
} LIMIT 1000
`.trim();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Fetch a URL and return the response body as a string.
 * Uses native fetch() (Node 18+). Falls back to https module.
 */
async function fetchUrl(url, options = {}) {
  const timeout = options.timeout || 120000;

  if (typeof fetch === 'function') {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const headers = options.headers || {};
      const resp = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'HealthyScan-VocabBuilder/1.0 (contact: healthyscan@example.com)',
          ...headers
        }
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      return await resp.text();
    } finally {
      clearTimeout(timer);
    }
  }

  // Fallback to https module
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      req.destroy();
      reject(new Error('Request timed out'));
    }, timeout);

    const req = https.get(url, {
      headers: {
        'User-Agent': 'HealthyScan-VocabBuilder/1.0',
        ...(options.headers || {})
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        clearTimeout(timer);
        return resolve(fetchUrl(res.headers.location, options));
      }
      if (res.statusCode !== 200) {
        clearTimeout(timer);
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        clearTimeout(timer);
        resolve(Buffer.concat(chunks).toString('utf8'));
      });
      res.on('error', e => { clearTimeout(timer); reject(e); });
    });
    req.on('error', e => { clearTimeout(timer); reject(e); });
  });
}

function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

function normalize(str) {
  if (!str) return '';
  return str.trim().toLowerCase();
}

// ─── Source 1: OpenFoodFacts Ingredients Taxonomy ────────────────────────────

async function fetchOFFIngredients() {
  console.log('\n[1/4] Fetching OpenFoodFacts Ingredients Taxonomy...');
  const url = 'https://world.openfoodfacts.org/data/taxonomies/ingredients.json';

  const raw = await fetchUrl(url, { timeout: 180000 });
  const data = JSON.parse(raw);

  const pairs = [];
  let checked = 0;

  for (const [key, entry] of Object.entries(data)) {
    checked++;

    // Extract English name
    let en = null;
    if (entry.name && entry.name.en) {
      en = entry.name.en;
    } else if (entry.en) {
      en = typeof entry.en === 'string' ? entry.en : null;
    }

    // Extract Russian name
    let ru = null;
    if (entry.name && entry.name.ru) {
      ru = entry.name.ru;
    } else if (entry.ru) {
      ru = typeof entry.ru === 'string' ? entry.ru : null;
    }

    if (en && ru) {
      // Handle comma-separated synonyms — take the first one
      const enName = en.split(',')[0].trim();
      const ruName = ru.split(',')[0].trim();

      if (enName && ruName) {
        pairs.push({
          english: enName,
          russian: ruName,
          e_number: null,
          category: 'food_ingredient',
          source: 'openfoodfacts_ingredients',
          confidence: 'high'
        });
      }
    }
  }

  console.log(`   Checked ${checked} entries, found ${pairs.length} en-ru pairs`);
  return pairs;
}

// ─── Source 2: OpenFoodFacts Additives Taxonomy ──────────────────────────────

async function fetchOFFAdditives() {
  console.log('\n[2/4] Fetching OpenFoodFacts Additives Taxonomy...');
  const url = 'https://world.openfoodfacts.org/data/taxonomies/additives.json';

  const raw = await fetchUrl(url, { timeout: 180000 });
  const data = JSON.parse(raw);

  const pairs = [];
  let checked = 0;

  for (const [key, entry] of Object.entries(data)) {
    checked++;

    // Extract English name
    let en = null;
    if (entry.name && entry.name.en) {
      en = entry.name.en;
    } else if (entry.en) {
      en = typeof entry.en === 'string' ? entry.en : null;
    }

    // Extract Russian name
    let ru = null;
    if (entry.name && entry.name.ru) {
      ru = entry.name.ru;
    } else if (entry.ru) {
      ru = typeof entry.ru === 'string' ? entry.ru : null;
    }

    // Try to extract E-number from the key
    let eNumber = null;
    const eMatch = key.match(/en:e(\d+[a-z]*)/i);
    if (eMatch) {
      eNumber = 'E' + eMatch[1].toUpperCase();
    }

    if (en && ru) {
      const enName = en.split(',')[0].trim();
      const ruName = ru.split(',')[0].trim();

      if (enName && ruName) {
        pairs.push({
          english: enName,
          russian: ruName,
          e_number: eNumber,
          category: 'food_additive',
          source: 'openfoodfacts_additives',
          confidence: 'high'
        });
      }
    }
  }

  console.log(`   Checked ${checked} entries, found ${pairs.length} en-ru pairs`);
  return pairs;
}

// ─── Source 3: Wikidata SPARQL — E-number additives ──────────────────────────

async function fetchWikidataEnumbers() {
  console.log('\n[3/4] Fetching Wikidata E-number additives...');

  const url = WIKIDATA_ENDPOINT + '?format=json&query=' + encodeURIComponent(SPARQL_ENUMBERS);

  const raw = await fetchUrl(url, {
    timeout: 120000,
    headers: {
      'Accept': 'application/sparql-results+json'
    }
  });
  const data = JSON.parse(raw);

  const pairs = [];
  const bindings = data.results?.bindings || [];

  for (const b of bindings) {
    const en = b.enLabel?.value?.trim();
    const ru = b.ruLabel?.value?.trim();
    const eNum = b.enumber?.value?.trim();

    if (en && ru) {
      pairs.push({
        english: en,
        russian: ru,
        e_number: eNum || null,
        category: 'food_additive',
        source: 'wikidata_enumbers',
        confidence: 'high'
      });
    }
  }

  console.log(`   Got ${bindings.length} bindings, extracted ${pairs.length} en-ru pairs`);
  return pairs;
}

// ─── Source 4: Wikidata SPARQL — Food ingredients ────────────────────────────

async function fetchWikidataFoodIngredients() {
  console.log('\n[4/4] Fetching Wikidata food ingredients...');

  const url = WIKIDATA_ENDPOINT + '?format=json&query=' + encodeURIComponent(SPARQL_FOOD_INGREDIENTS);

  const raw = await fetchUrl(url, {
    timeout: 120000,
    headers: {
      'Accept': 'application/sparql-results+json'
    }
  });
  const data = JSON.parse(raw);

  const pairs = [];
  const bindings = data.results?.bindings || [];

  for (const b of bindings) {
    const en = b.enLabel?.value?.trim();
    const ru = b.ruLabel?.value?.trim();

    if (en && ru) {
      pairs.push({
        english: en,
        russian: ru,
        e_number: null,
        category: 'food_ingredient',
        source: 'wikidata_food',
        confidence: 'high'
      });
    }
  }

  console.log(`   Got ${bindings.length} bindings, extracted ${pairs.length} en-ru pairs`);
  return pairs;
}

// ─── Merge & Deduplicate ─────────────────────────────────────────────────────

function mergeAndDeduplicate(allPairs) {
  console.log('\n--- Merging and deduplicating ---');

  const seen = new Map(); // key = normalized(en) + '|||' + normalized(ru)
  const merged = [];
  const stats = { total: 0, unique: 0, duplicates: 0 };

  for (const pair of allPairs) {
    stats.total++;
    const key = normalize(pair.english) + '|||' + normalize(pair.russian);

    if (seen.has(key)) {
      stats.duplicates++;
      continue;
    }

    seen.set(key, true);
    merged.push(pair);
    stats.unique++;
  }

  console.log(`   Total pairs across all sources: ${stats.total}`);
  console.log(`   Duplicates removed: ${stats.duplicates}`);
  console.log(`   Unique pairs: ${stats.unique}`);

  return merged;
}

// ─── Generate SQL ────────────────────────────────────────────────────────────

function generateSQL(pairs) {
  console.log('\n--- Generating SQL ---');

  // Compute stats
  const bySource = {};
  const byCategory = {};
  const byConfidence = {};
  let withENumber = 0;

  for (const p of pairs) {
    bySource[p.source] = (bySource[p.source] || 0) + 1;
    byCategory[p.category] = (byCategory[p.category] || 0) + 1;
    byConfidence[p.confidence] = (byConfidence[p.confidence] || 0) + 1;
    if (p.e_number) withENumber++;
  }

  const now = new Date().toISOString().split('T')[0];

  let sql = '';
  sql += '-- ============================================================================\n';
  sql += '-- Russian-English Dictionary (russian_english_dict)\n';
  sql += '-- OUR OWNED VOCABULARY ASSET\n';
  sql += `-- Generated: ${now}\n`;
  sql += '-- \n';
  sql += `-- Total entries: ${pairs.length}\n`;
  sql += `-- Entries with E-numbers: ${withENumber}\n`;
  sql += '-- \n';
  sql += '-- By source:\n';
  for (const [src, cnt] of Object.entries(bySource).sort((a, b) => b[1] - a[1])) {
    sql += `--   ${src}: ${cnt}\n`;
  }
  sql += '-- \n';
  sql += '-- By category:\n';
  for (const [cat, cnt] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    sql += `--   ${cat}: ${cnt}\n`;
  }
  sql += '-- \n';
  sql += '-- By confidence:\n';
  for (const [conf, cnt] of Object.entries(byConfidence).sort((a, b) => b[1] - a[1])) {
    sql += `--   ${conf}: ${cnt}\n`;
  }
  sql += '-- \n';
  sql += '-- Sources:\n';
  sql += '--   1. OpenFoodFacts Ingredients Taxonomy (https://world.openfoodfacts.org/data/taxonomies/ingredients.json)\n';
  sql += '--   2. OpenFoodFacts Additives Taxonomy (https://world.openfoodfacts.org/data/taxonomies/additives.json)\n';
  sql += '--   3. Wikidata SPARQL — E-number food additives\n';
  sql += '--   4. Wikidata SPARQL — Food ingredients (instance of food ingredient)\n';
  sql += '-- ============================================================================\n\n';

  // Table creation
  sql += '-- Drop and recreate table\n';
  sql += 'DROP TABLE IF EXISTS russian_english_dict;\n\n';
  sql += 'CREATE TABLE IF NOT EXISTS russian_english_dict (\n';
  sql += '    id INTEGER PRIMARY KEY AUTOINCREMENT,\n';
  sql += '    english TEXT NOT NULL,\n';
  sql += '    russian TEXT NOT NULL,\n';
  sql += '    e_number TEXT,\n';
  sql += '    category TEXT,\n';
  sql += '    source TEXT,\n';
  sql += '    confidence TEXT DEFAULT \'high\',\n';
  sql += '    created_at TEXT DEFAULT (datetime(\'now\'))\n';
  sql += ');\n\n';
  sql += 'CREATE INDEX IF NOT EXISTS idx_red_english ON russian_english_dict(english);\n';
  sql += 'CREATE INDEX IF NOT EXISTS idx_red_russian ON russian_english_dict(russian);\n';
  sql += 'CREATE INDEX IF NOT EXISTS idx_red_e_number ON russian_english_dict(e_number);\n\n';

  // Insert in batches of 500
  const BATCH_SIZE = 500;
  const totalBatches = Math.ceil(pairs.length / BATCH_SIZE);

  for (let batch = 0; batch < totalBatches; batch++) {
    const start = batch * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, pairs.length);
    const slice = pairs.slice(start, end);

    sql += `-- Batch ${batch + 1}/${totalBatches} (rows ${start + 1}-${end})\n`;
    sql += 'INSERT INTO russian_english_dict (english, russian, e_number, category, source, confidence) VALUES\n';

    const rows = slice.map((p, i) => {
      const en = escapeSql(p.english);
      const ru = escapeSql(p.russian);
      const eNum = p.e_number ? `'${escapeSql(p.e_number)}'` : 'NULL';
      const cat = p.category ? `'${escapeSql(p.category)}'` : 'NULL';
      const src = p.source ? `'${escapeSql(p.source)}'` : 'NULL';
      const conf = p.confidence ? `'${escapeSql(p.confidence)}'` : "'high'";
      const comma = (i < slice.length - 1) ? ',' : ';';
      return `('${en}', '${ru}', ${eNum}, ${cat}, ${src}, ${conf})${comma}`;
    });

    sql += rows.join('\n') + '\n\n';
  }

  return sql;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Russian-English Food Vocabulary Builder ===');
  console.log(`Started: ${new Date().toISOString()}`);

  const allPairs = [];
  const sourceResults = {};

  // Source 1: OFF Ingredients
  try {
    const pairs = await fetchOFFIngredients();
    sourceResults['openfoodfacts_ingredients'] = pairs.length;
    allPairs.push(...pairs);
  } catch (err) {
    console.error(`   FAILED: ${err.message}`);
    sourceResults['openfoodfacts_ingredients'] = 'FAILED';
  }

  // Source 2: OFF Additives
  try {
    const pairs = await fetchOFFAdditives();
    sourceResults['openfoodfacts_additives'] = pairs.length;
    allPairs.push(...pairs);
  } catch (err) {
    console.error(`   FAILED: ${err.message}`);
    sourceResults['openfoodfacts_additives'] = 'FAILED';
  }

  // Source 3: Wikidata E-numbers
  try {
    const pairs = await fetchWikidataEnumbers();
    sourceResults['wikidata_enumbers'] = pairs.length;
    allPairs.push(...pairs);
  } catch (err) {
    console.error(`   FAILED: ${err.message}`);
    sourceResults['wikidata_enumbers'] = 'FAILED';
  }

  // Source 4: Wikidata Food Ingredients
  try {
    const pairs = await fetchWikidataFoodIngredients();
    sourceResults['wikidata_food'] = pairs.length;
    allPairs.push(...pairs);
  } catch (err) {
    console.error(`   FAILED: ${err.message}`);
    sourceResults['wikidata_food'] = 'FAILED';
  }

  // Summary
  console.log('\n=== Source Summary ===');
  for (const [src, result] of Object.entries(sourceResults)) {
    const status = typeof result === 'number' ? `${result} pairs` : result;
    console.log(`   ${src}: ${status}`);
  }

  if (allPairs.length === 0) {
    console.error('\nERROR: No pairs collected from any source. Aborting.');
    process.exit(1);
  }

  // Merge and deduplicate
  const merged = mergeAndDeduplicate(allPairs);

  // Sort: food_additive first (useful), then food_ingredient, alphabetical within
  merged.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category === 'food_additive' ? -1 : 1;
    }
    return a.english.toLowerCase().localeCompare(b.english.toLowerCase());
  });

  // Generate SQL
  const sql = generateSQL(merged);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, sql, 'utf8');

  const sizeMB = (Buffer.byteLength(sql, 'utf8') / (1024 * 1024)).toFixed(2);
  console.log(`\nSQL written to: ${OUTPUT_FILE}`);
  console.log(`File size: ${sizeMB} MB`);
  console.log(`Total entries: ${merged.length}`);
  console.log(`\nDone: ${new Date().toISOString()}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
