#!/usr/bin/env node
/**
 * Shufersal Cosmetics & Personal Care Scraper
 * Scrapes products from Shufersal's website (includes Be Pharm products)
 * Extracts: Hebrew names, barcodes (from product codes), brands, manufacturers
 */

import { writeFileSync } from 'fs';

const DELAY_MS = 600;

const SEARCH_TERMS = [
  'שמפו', 'סבון', 'קרם לחות', 'קרם פנים', 'סרום פנים',
  'ג\'ל רחצה', 'דאודורנט', 'מרכך שיער', 'קרם גוף', 'שפתון',
  'מסקרה', 'קרם הגנה', 'תחליב גוף', 'קרם ידיים', 'קרם עיניים',
  'מסכת פנים', 'טונר', 'פיילינג', 'שמן גוף', 'קרם תינוקות',
  'משחת שיניים', 'שטיפת פה', 'קרם גילוח', 'בושם', 'מגבונים',
  'ויטמינים', 'פרוביוטיקה', 'קולגן', 'אומגה',
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

function extractBarcode(code) {
  if (!code) return null;
  const match = code.match(/P_(\d{7,14})/);
  return match ? match[1] : (code.match(/^\d{7,14}$/) ? code : null);
}

async function fetchShufersal(query, page) {
  const url = `https://www.shufersal.co.il/online/he/search/results?q=${encodeURIComponent(query)}&page=${page}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8'
      }
    });
    if (!res.ok) {
      console.error(`  HTTP ${res.status} for "${query}" page ${page}`);
      return null;
    }

    const html = await res.text();
    const products = [];

    // Extract product codes (P_BARCODE format) and names from HTML
    const codeRegex = /P_(\d{7,14})/g;
    const barcodes = new Set();
    let m;
    while ((m = codeRegex.exec(html)) !== null) {
      barcodes.add(m[1]);
    }

    // Try to extract product names near product codes
    const prodRegex = /data-product-code="(P_\d+)"[\s\S]*?(?:data-product-name="([^"]*)")?/g;
    while ((m = prodRegex.exec(html)) !== null) {
      products.push({
        code: m[1],
        name_he: m[2] || null,
        ean: extractBarcode(m[1])
      });
    }

    // Also grab product names from title/text elements near product links
    const nameRegex = /(?:miglog-prod-name|productName|product-name)[^>]*>([^<]+)/g;
    const names = [];
    while ((m = nameRegex.exec(html)) !== null) {
      names.push(m[1].trim());
    }

    // If we got barcodes but not matched to names, add them standalone
    for (const bc of barcodes) {
      if (!products.find(p => p.ean === bc)) {
        products.push({
          code: `P_${bc}`,
          name_he: null,
          ean: bc
        });
      }
    }

    const hasNext = html.includes('class="next"') || html.includes('paginationNext') || html.includes('aria-label="Next"');
    return { products, hasNext, barcodesFound: barcodes.size };
  } catch (e) {
    console.error(`  Error: ${e.message}`);
    return null;
  }
}

async function scrapeAll() {
  console.log('=== SHUFERSAL COSMETICS SCRAPER ===');
  console.log(`Started: ${new Date().toISOString()}\n`);

  const allProducts = new Map();
  let totalFetched = 0;

  for (const term of SEARCH_TERMS) {
    console.log(`\nSearching: "${term}"`);
    let page = 0;
    let hasMore = true;

    while (hasMore && page < 15) {
      const data = await fetchShufersal(term, page);
      if (!data || (data.products.length === 0 && data.barcodesFound === 0)) {
        hasMore = false;
        break;
      }

      for (const item of data.products) {
        totalFetched++;
        const key = item.ean || item.code || `nokey_${totalFetched}`;
        if (!allProducts.has(key)) {
          allProducts.set(key, {
            name_he: item.name_he || null,
            brand: item.brand || null,
            manufacturer: item.manufacturer || null,
            ean: item.ean || null,
            code: item.code || null,
            price: item.price || null,
            source: 'shufersal'
          });
        }
      }

      console.log(`  Page ${page + 1} — ${data.products.length} products, ${data.barcodesFound} barcodes (${allProducts.size} unique total)`);

      if (!data.hasNext) {
        hasMore = false;
      } else {
        page++;
        await sleep(DELAY_MS);
      }
    }
  }

  const withEan = [...allProducts.values()].filter(p => p.ean);
  const withName = [...allProducts.values()].filter(p => p.name_he);

  console.log(`\n=== RESULTS ===`);
  console.log(`Total fetched: ${totalFetched}`);
  console.log(`Unique products: ${allProducts.size}`);
  console.log(`With barcode: ${withEan.length}`);
  console.log(`With Hebrew name: ${withName.length}`);

  const output = {
    scraped_at: new Date().toISOString(),
    source: 'shufersal.co.il',
    total_unique: allProducts.size,
    with_ean: withEan.length,
    with_name_he: withName.length,
    products: [...allProducts.values()]
  };

  const outPath = 'C:/BENDA_PROJECT/ROOTS_BY_BENDA/04_SAFETY_DATA/shufersal_products.json';
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${outPath}`);
  console.log(`Finished: ${new Date().toISOString()}`);
}

scrapeAll().catch(e => { console.error('FATAL:', e); process.exit(1); });
