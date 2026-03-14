#!/usr/bin/env node
/**
 * Super-Pharm Slow Scraper — 3s delay, single search term, full pagination
 * The API has ~16,680 cosmetics products across 556 pages
 * Using the broad "קוסמטיקה" category which covers everything
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';

const BASE_URL = 'https://shop.super-pharm.co.il/search/jsonSearch';
const PAGE_SIZE = 30;
const DELAY_MS = 3000; // 3 seconds between requests
const OUT_PATH = 'C:/BENDA_PROJECT/ROOTS_BY_BENDA/04_SAFETY_DATA/superpharm_products.json';

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Load existing products to resume from where we left off
let existing = new Map();
if (existsSync(OUT_PATH)) {
  try {
    const prev = JSON.parse(readFileSync(OUT_PATH, 'utf8'));
    for (const p of (prev.products || [])) {
      const key = p.ean || p.code;
      if (key) existing.set(key, p);
    }
    console.log(`Loaded ${existing.size} existing products from previous scrape`);
  } catch {}
}

async function fetchPage(query, page) {
  const url = `${BASE_URL}?q=${encodeURIComponent(query)}&page=${page}&pageSize=${PAGE_SIZE}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://shop.super-pharm.co.il/cosmetics',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    if (!res.ok) {
      console.error(`  HTTP ${res.status} on page ${page}`);
      return { error: res.status };
    }
    return await res.json();
  } catch (e) {
    console.error(`  Error on page ${page}: ${e.message}`);
    return { error: e.message };
  }
}

function extractProduct(item) {
  const details = item.productDetails || {};
  return {
    name_he: item.name || null,
    brand: item.title || null,
    ean: details.ean || null,
    code: details.code || null,
    price: details.price ? parseFloat(details.price) : null,
    discount_price: details.discountPrice ? parseFloat(details.discountPrice) : null,
    category_path: details.simpleCategoryPath || null,
    url: item.fullUrl || (item.url ? `https://shop.super-pharm.co.il${item.url}` : null),
    unit: item.costPerUnit || null,
    description: item.description || null,
    in_stock: details.outOfStock === false,
    source: 'super-pharm'
  };
}

function saveProgress(allProducts) {
  const products = [...allProducts.values()];
  const withEan = products.filter(p => p.ean);
  const output = {
    scraped_at: new Date().toISOString(),
    source: 'super-pharm.co.il',
    total_unique: products.length,
    with_ean: withEan.length,
    products
  };
  writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));
  console.log(`  Progress saved: ${products.length} products`);
}

async function scrapeAll() {
  console.log('=== SUPER-PHARM SLOW SCRAPER ===');
  console.log(`Started: ${new Date().toISOString()}`);
  console.log(`Delay: ${DELAY_MS}ms between requests\n`);

  const allProducts = new Map(existing);

  // Use broad search that covers all cosmetics
  // NOTE: ':relevance:category:cosmetics' no longer works (returns 0 results)
  // 'קוסמטיקה' returns all 16,696 products — use it as primary
  const SEARCHES = [
    'קוסמטיקה',
    'טיפוח',
    'איפור',
    'בושם',
    'שמפו',
    'סבון',
    'קרם',
    'דאודורנט',
    'תחליב',
    'מסכה',
    'סרום',
    'לק',
    'מייק אפ',
    'טוש',
    'שפתון',
    'מסקרה',
  ];

  let consecutiveErrors = 0;

  for (const term of SEARCHES) {
    console.log(`\n=== Searching: "${term}" ===`);
    let page = 0;

    while (true) {
      const data = await fetchPage(term, page);

      if (data.error) {
        consecutiveErrors++;
        if (data.error === 481 || data.error === 429 || consecutiveErrors >= 3) {
          console.log(`  Rate limited or too many errors (${consecutiveErrors} consecutive). Backing off 60s...`);
          await sleep(60000);
          consecutiveErrors = 0;

          // Retry once
          const retry = await fetchPage(term, page);
          if (retry.error) {
            console.log(`  Still failing after backoff. Moving to next search term.`);
            // Save progress before moving on
            saveProgress(allProducts);
            break;
          }
          // Process retry data
          if (retry.results) {
            for (const item of retry.results) {
              const product = extractProduct(item);
              const key = product.ean || `code_${product.code}`;
              if (key && !allProducts.has(key)) allProducts.set(key, product);
            }
          }
        }
        break;
      }

      consecutiveErrors = 0;

      if (!data.results || data.results.length === 0) break;

      for (const item of data.results) {
        const product = extractProduct(item);
        const key = product.ean || `code_${product.code}`;
        if (key && !allProducts.has(key)) {
          allProducts.set(key, product);
        }
      }

      const pagination = data.pagination || {};
      const totalPages = pagination.numberOfPages || 1;
      const total = pagination.totalNumberOfResults || '?';

      console.log(`  Page ${page + 1}/${totalPages} — ${data.results.length} items (${allProducts.size} unique / ${total} total)`);

      if (page + 1 >= totalPages) break;
      page++;
      await sleep(DELAY_MS);
    }
  }

  // Save
  const products = [...allProducts.values()];
  const withEan = products.filter(p => p.ean);

  console.log(`\n=== FINAL RESULTS ===`);
  console.log(`Unique products: ${products.length}`);
  console.log(`With EAN barcode: ${withEan.length}`);

  const categories = {};
  for (const p of products) {
    const cat = p.category_path ? p.category_path.split('/')[0] : 'unknown';
    categories[cat] = (categories[cat] || 0) + 1;
  }
  console.log('\nTop categories:');
  Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([c, n]) => console.log(`  ${c}: ${n}`));

  const output = {
    scraped_at: new Date().toISOString(),
    source: 'super-pharm.co.il',
    total_unique: products.length,
    with_ean: withEan.length,
    products
  };

  writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${OUT_PATH}`);
  console.log(`Finished: ${new Date().toISOString()}`);
}

scrapeAll().catch(e => { console.error('FATAL:', e); process.exit(1); });
