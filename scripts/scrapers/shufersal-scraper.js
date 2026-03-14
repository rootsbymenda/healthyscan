/**
 * Shufersal Full Catalog Scraper for Healthy Scan
 *
 * Phase 1: Discover all food product codes via search API (JSON)
 * Phase 2: Scrape each product page for full data (HTML)
 * Output: Standardized JSON per product
 *
 * Usage:
 *   node shufersal-scraper.js discover     # Phase 1: collect product codes
 *   node shufersal-scraper.js scrape       # Phase 2: scrape product details
 *   node shufersal-scraper.js all          # Both phases
 */

const fs = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────
const BASE_URL = 'https://www.shufersal.co.il/online/he';
const SEARCH_API = `${BASE_URL}/search/results`;
const PAGE_SIZE = 20; // Shufersal caps at 20 per page
const CONCURRENCY = 3;           // parallel requests (be nice)
const DELAY_MS = 500;            // delay between batches
const PRODUCT_DELAY_MS = 800;    // delay between product page scrapes

const OUT_DIR = path.join(__dirname, '..', '..', 'data', 'shufersal');
const DISCOVERY_FILE = path.join(OUT_DIR, 'discovered-products.json');
const PRODUCTS_DIR = path.join(OUT_DIR, 'products');
const CATALOG_FILE = path.join(OUT_DIR, 'shufersal-catalog.json');

// Food-relevant categories only (skip B=pharm/cosmetics, G=home goods)
const FOOD_CATEGORIES = [
  { code: 'A01', name: 'מוצרי חלב וביצים' },
  { code: 'A04', name: 'בשר עוף ודגים' },
  { code: 'A07', name: 'פירות וירקות' },
  { code: 'A10', name: 'קפואים' },
  { code: 'A13', name: 'שתייה' },
  { code: 'A15', name: 'תבלינים ושימורים' },
  { code: 'A16', name: 'ממתקים וחטיפים' },
  { code: 'A22', name: 'בסיסי בישול ואפייה' },
  { code: 'A24', name: 'לחם ומאפים' },
  { code: 'F',   name: 'green בריאות וטבע' },
];

// ─── Helpers ─────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJSON(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'HealthyScan-Catalog-Builder/1.0',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function fetchHTML(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'HealthyScan-Catalog-Builder/1.0',
      'Accept': 'text/html',
      'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

// ─── Phase 1: Discovery ─────────────────────────────────────
async function discoverCategory(catCode) {
  const products = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const url = `${SEARCH_API}?q=:relevance:allCategories:${catCode}&ajax=true&pageSize=${PAGE_SIZE}&page=${page}`;
    try {
      const data = await fetchJSON(url);
      totalPages = data.pagination?.numberOfPages || 1;
      const results = data.results || [];

      for (const p of results) {
        if (!p.food) continue; // skip non-food items
        products.push({
          code: p.code,
          name: p.name,
          barcode: p.code?.replace('P_', '') || null,
          url: p.url,
          brandName: p.brandName || null,
          price: p.price?.value || null,
          unitDescription: p.unitDescription || null,
          calories: p.calories || null,
          fats: p.fats || null,
          sodium: p.sodium || null,
          sugar: p.sugar || null,
          healthAttributes: p.healthAttributes?.map(h => h.code) || [],
          categoryCode: catCode,
        });
      }

      console.log(`  [${catCode}] page ${page + 1}/${totalPages} — ${results.length} items (${products.length} food total)`);
      page++;
      if (page < totalPages) await sleep(DELAY_MS);
    } catch (err) {
      console.error(`  [${catCode}] ERROR page ${page}: ${err.message}`);
      page++; // skip and continue
    }
  }

  return products;
}

async function runDiscovery() {
  console.log('\n═══ PHASE 1: PRODUCT DISCOVERY ═══\n');
  ensureDir(OUT_DIR);

  const allProducts = new Map(); // dedupe by code

  for (const cat of FOOD_CATEGORIES) {
    console.log(`\nCategory ${cat.code}: ${cat.name}`);
    const products = await discoverCategory(cat.code);
    for (const p of products) {
      if (!allProducts.has(p.code)) {
        allProducts.set(p.code, p);
      }
    }
    console.log(`  → ${products.length} food products (${allProducts.size} unique total)`);
    await sleep(DELAY_MS);
  }

  const discovered = [...allProducts.values()];
  fs.writeFileSync(DISCOVERY_FILE, JSON.stringify(discovered, null, 2), 'utf8');
  console.log(`\n✓ Discovery complete: ${discovered.length} unique food products`);
  console.log(`  Saved to: ${DISCOVERY_FILE}`);
  return discovered;
}

// ─── Phase 2: Product Page Scraping ──────────────────────────
// Lightweight HTML parsing without cheerio (no npm install needed)
function extractBetween(html, startMarker, endMarker) {
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return null;
  const afterStart = startIdx + startMarker.length;
  const endIdx = html.indexOf(endMarker, afterStart);
  if (endIdx === -1) return null;
  return html.substring(afterStart, endIdx).trim();
}

function extractAllBetween(html, startMarker, endMarker) {
  const results = [];
  let searchFrom = 0;
  while (true) {
    const startIdx = html.indexOf(startMarker, searchFrom);
    if (startIdx === -1) break;
    const afterStart = startIdx + startMarker.length;
    const endIdx = html.indexOf(endMarker, afterStart);
    if (endIdx === -1) break;
    results.push(html.substring(afterStart, endIdx).trim());
    searchFrom = endIdx + endMarker.length;
  }
  return results;
}

function stripTags(html) {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseProductPage(html, basicData) {
  const product = {
    source: 'shufersal',
    code: basicData.code,
    barcode: basicData.barcode,
    name: basicData.name,
    brand: basicData.brandName,
    price_ils: basicData.price,
    unit_description: basicData.unitDescription,
    category_code: basicData.categoryCode,

    // From HTML - will be filled below
    country_of_origin: null,
    kashrut: null,
    kashrut_pesach: null,
    dairy_meat_parve: null,
    foreign_milk_powder: null,
    local_rabbinate: null,

    ingredients_raw: null,
    allergens: null,
    additional_characteristics: null,

    nutrition_per_100g: {
      calories: basicData.calories,
      fats: basicData.fats,
      sodium: basicData.sodium,
      sugar: basicData.sugar,
      protein: null,
      carbs: null,
      fiber: null,
      saturated_fat: null,
      trans_fat: null,
      cholesterol: null,
      calcium: null,
      sugar_spoons: null,
    },

    health_attributes: basicData.healthAttributes || [],
    product_description: null,
    image_url: null,
    scraped_at: new Date().toISOString(),
  };

  try {
    // ── LD+JSON structured data (most reliable for barcode + image) ──
    const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (ldMatch) {
      try {
        const ld = JSON.parse(ldMatch[1]);
        if (ld.gtin13) product.barcode = ld.gtin13;
        if (ld.image?.[0]) product.image_url = ld.image[0];
      } catch(e) {}
    }

    // ── Product description ──
    const descMatch = html.match(/class="productDescriptionText"[^>]*>([\s\S]*?)<\/div>/);
    if (descMatch) {
      product.product_description = stripTags(descMatch[1]);
    }

    // ── Data fields (נתונים) ──
    // Pattern: <div class="name">LABEL:</div> ... <div class="text tooltip-js" title="VALUE">VALUE</div>
    function extractDataField(label) {
      const re = new RegExp(
        label + '\\s*<\\/div>[\\s\\S]*?<div\\s+class="text[^"]*"[^>]*>([^<]+)',
      );
      const m = html.match(re);
      return m ? m[1].trim() : null;
    }

    product.country_of_origin   = extractDataField('ארץ ייצור:');
    product.kashrut             = extractDataField('כשרות:');
    product.kashrut_pesach      = extractDataField('כשרות פסח:');
    product.dairy_meat_parve    = extractDataField('חלבי/בשרי/פרווה:');
    product.foreign_milk_powder = extractDataField('אבקת חלב נוכרי:');
    product.local_rabbinate     = extractDataField('רבנות מקומית:');

    // Pesach (may be separate from כשרות פסח)
    if (!product.kashrut_pesach) {
      product.kashrut_pesach = extractDataField('פסח:');
    }

    // ── Ingredients (רכיבים) ──
    // Pattern: רכיבים: FULL TEXT...\n</div>
    const ingMatch = html.match(/רכיבים:\s*([\s\S]*?)<\/div>/);
    if (ingMatch) {
      product.ingredients_raw = stripTags(ingMatch[1]);
    }

    // ── Allergens (מכיל) ──
    // Pattern: <div>מכיל</div>...<div class="alergiesProperties">VALUE</div>
    const allergensMatch = html.match(/<div>מכיל[\s\S]*?<div class="alergiesProperties">([\s\S]*?)<\/div>/);
    if (allergensMatch) {
      product.allergens = stripTags(allergensMatch[1].replace(/<br\s*\/?>/g, ', '));
    }

    // ── Additional characteristics (מאפיינים נוספים) ──
    // Pattern: מאפיינים נוספים</div>...<div class="featuresList">VALUE</div>
    const charMatch = html.match(/מאפיינים נוספים[\s\S]*?<div class="featuresList">([\s\S]*?)<\/div>/);
    if (charMatch) {
      product.additional_characteristics = stripTags(charMatch[1].replace(/<br\s*\/?>/g, ', '));
    }

    // ── Nutrition per 100g ──
    // Extract each nutritionItem block, then parse value + name from it
    // HTML pattern: <div class="nutritionItem">
    //   <div class="number tooltip-js" title="VALUE">VALUE</div>
    //   <div class="name">UNIT</div>
    //   <div class="text">NAME</div>
    // </div>
    const nutritionMap = {
      'חלבונים': 'protein',
      'פחמימות': 'carbs',
      'שומנים': 'fats',
      'אנרגיה': 'calories',
      'סיבים תזונתיים': 'fiber',
      'סוכרים מתוך פחמימות': 'sugar',
      'נתרן': 'sodium',
      'מתוכם שומן רווי': 'saturated_fat',
      'שומן רווי': 'saturated_fat',
      'חומצות שומן טרנס': 'trans_fat',
      'שומן טרנס': 'trans_fat',
      'כולסטרול': 'cholesterol',
      'סידן': 'calcium',
      'כפיות סוכר': 'sugar_spoons',
    };

    const itemRegex = /<div class="nutritionItem">([\s\S]*?)<\/div>\s*<\/div>/g;
    let itemMatch;
    while ((itemMatch = itemRegex.exec(html)) !== null) {
      const block = itemMatch[1];
      const titleMatch = block.match(/title="([^"]+)"/);
      const nameMatch = block.match(/class="text">([^<]+)/);
      if (!titleMatch || !nameMatch) continue;

      const val = titleMatch[1].trim();
      const name = nameMatch[1].trim();
      const key = nutritionMap[name];
      if (!key) continue;

      if (val.includes('פחות') || val.includes('less')) {
        product.nutrition_per_100g[key] = val;
      } else {
        const num = parseFloat(val);
        if (!isNaN(num)) product.nutrition_per_100g[key] = num;
      }
    }

  } catch (err) {
    console.error(`  Parse error for ${basicData.code}: ${err.message}`);
  }

  return product;
}

async function scrapeProduct(basicData) {
  const productUrl = `${BASE_URL}${basicData.url}`;
  try {
    const html = await fetchHTML(productUrl);
    return parseProductPage(html, basicData);
  } catch (err) {
    console.error(`  Failed to scrape ${basicData.code}: ${err.message}`);
    // Return basic data even if HTML scrape fails
    return {
      source: 'shufersal',
      code: basicData.code,
      barcode: basicData.barcode,
      name: basicData.name,
      brand: basicData.brandName,
      price_ils: basicData.price,
      unit_description: basicData.unitDescription,
      category_code: basicData.categoryCode,
      nutrition_per_100g: {
        calories: basicData.calories,
        fats: basicData.fats,
        sodium: basicData.sodium,
      },
      health_attributes: basicData.healthAttributes || [],
      scrape_error: err.message,
      scraped_at: new Date().toISOString(),
    };
  }
}

async function runScraping() {
  console.log('\n═══ PHASE 2: PRODUCT SCRAPING ═══\n');

  if (!fs.existsSync(DISCOVERY_FILE)) {
    console.error('No discovery file found. Run "discover" first.');
    process.exit(1);
  }

  const discovered = JSON.parse(fs.readFileSync(DISCOVERY_FILE, 'utf8'));
  ensureDir(PRODUCTS_DIR);

  // Check what's already scraped
  const alreadyScraped = new Set();
  if (fs.existsSync(PRODUCTS_DIR)) {
    for (const f of fs.readdirSync(PRODUCTS_DIR)) {
      if (f.endsWith('.json')) alreadyScraped.add(f.replace('.json', ''));
    }
  }

  const toScrape = discovered.filter(p => !alreadyScraped.has(p.code));
  console.log(`Total discovered: ${discovered.length}`);
  console.log(`Already scraped: ${alreadyScraped.size}`);
  console.log(`Remaining: ${toScrape.length}\n`);

  const allProducts = [];
  let scraped = 0;
  let errors = 0;

  // Process in batches
  for (let i = 0; i < toScrape.length; i += CONCURRENCY) {
    const batch = toScrape.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(p => scrapeProduct(p)));

    for (const product of results) {
      // Save individual product file (for resume capability)
      const productFile = path.join(PRODUCTS_DIR, `${product.code}.json`);
      fs.writeFileSync(productFile, JSON.stringify(product, null, 2), 'utf8');
      allProducts.push(product);

      if (product.scrape_error) errors++;
      scraped++;
    }

    const pct = ((i + batch.length) / toScrape.length * 100).toFixed(1);
    console.log(`[${pct}%] Scraped ${scraped}/${toScrape.length} (${errors} errors)`);

    if (i + CONCURRENCY < toScrape.length) await sleep(PRODUCT_DELAY_MS);
  }

  // Also load previously scraped products
  for (const code of alreadyScraped) {
    const f = path.join(PRODUCTS_DIR, `${code}.json`);
    allProducts.push(JSON.parse(fs.readFileSync(f, 'utf8')));
  }

  // Write combined catalog
  fs.writeFileSync(CATALOG_FILE, JSON.stringify(allProducts, null, 2), 'utf8');
  console.log(`\n✓ Scraping complete: ${allProducts.length} products`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Catalog saved to: ${CATALOG_FILE}`);
}

// ─── Main ────────────────────────────────────────────────────
async function main() {
  const command = process.argv[2] || 'all';
  console.log(`\n🔍 Shufersal Catalog Scraper — Healthy Scan`);
  console.log(`   Command: ${command}\n`);

  if (command === 'discover' || command === 'all') {
    await runDiscovery();
  }
  if (command === 'scrape' || command === 'all') {
    await runScraping();
  }
  if (!['discover', 'scrape', 'all'].includes(command)) {
    console.log('Usage: node shufersal-scraper.js [discover|scrape|all]');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
