#!/usr/bin/env node
/**
 * Super-Pharm Cosmetics Catalog Scraper
 * Scrapes all cosmetics/personal care products from Super-Pharm's JSON API
 * Extracts: Hebrew names, EAN barcodes, brands, categories, prices
 */

import { writeFileSync } from 'fs';

const BASE_URL = 'https://shop.super-pharm.co.il/search/jsonSearch';
const PAGE_SIZE = 30;
const DELAY_MS = 500; // be respectful

// Cosmetics & personal care search terms (Hebrew)
const SEARCH_TERMS = [
  'קוסמטיקה',      // cosmetics
  'שמפו',          // shampoo
  'סבון',          // soap
  'קרם',           // cream
  'קרם לחות',      // moisturizer
  'קרם פנים',      // face cream
  'סרום',          // serum
  'מסכה',          // mask
  'שמן',           // oil
  'ג\'ל רחצה',     // shower gel
  'דאודורנט',      // deodorant
  'מי פנים',       // toner
  'קרם עיניים',    // eye cream
  'קרם גוף',       // body cream
  'מרכך',          // conditioner
  'קרם שיער',      // hair cream
  'לק',            // nail polish
  'שפתון',         // lipstick
  'מסקרה',         // mascara
  'פאונדיישן',     // foundation
  'קונסילר',       // concealer
  'פודרה',         // powder
  'בושם',          // perfume
  'קרם הגנה',      // sunscreen
  'תחליב',         // lotion
  'אנטי אייג\'ינג', // anti aging
  'טיפוח שיער',    // hair care
  'טיפוח עור',     // skin care
  'איפור',         // makeup
  'ניקוי פנים',    // face cleansing
  'תינוקות',       // baby care
  'גילוח',         // shaving
  'טיפוח ציפורניים', // nail care
  'טיפוח גוף',     // body care
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchPage(query, page) {
  const url = `${BASE_URL}?q=${encodeURIComponent(query)}&page=${page}&pageSize=${PAGE_SIZE}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8'
      }
    });
    if (!res.ok) {
      console.error(`  HTTP ${res.status} for "${query}" page ${page}`);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error(`  Error fetching "${query}" page ${page}: ${e.message}`);
    return null;
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
    rating: item.yotpoProductScore || null,
    in_stock: details.outOfStock === false,
    source: 'super-pharm'
  };
}

async function scrapeAll() {
  console.log('=== SUPER-PHARM COSMETICS SCRAPER ===');
  console.log(`Started: ${new Date().toISOString()}\n`);

  const allProducts = new Map(); // ean -> product (dedup by barcode)
  const noEan = []; // products without barcode
  let totalFetched = 0;

  for (const term of SEARCH_TERMS) {
    console.log(`\nSearching: "${term}"`);
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const data = await fetchPage(term, page);
      if (!data || !data.results || data.results.length === 0) {
        hasMore = false;
        break;
      }

      for (const item of data.results) {
        const product = extractProduct(item);
        totalFetched++;

        if (product.ean) {
          if (!allProducts.has(product.ean)) {
            allProducts.set(product.ean, product);
          }
        } else if (product.code) {
          // No EAN but has internal code
          const key = `code_${product.code}`;
          if (!allProducts.has(key)) {
            allProducts.set(key, product);
            noEan.push(product);
          }
        }
      }

      const pagination = data.pagination || {};
      const totalPages = pagination.numberOfPages || 1;
      const currentPage = pagination.currentPage || 0;

      console.log(`  Page ${currentPage + 1}/${totalPages} — ${data.results.length} products (${allProducts.size} unique so far)`);

      if (currentPage + 1 >= totalPages || page >= 50) {
        hasMore = false;
      } else {
        page++;
        await sleep(DELAY_MS);
      }
    }
  }

  // Separate products with and without EAN
  const withEan = [];
  const withoutEan = [];
  for (const [key, prod] of allProducts) {
    if (key.startsWith('code_')) {
      withoutEan.push(prod);
    } else {
      withEan.push(prod);
    }
  }

  console.log(`\n=== RESULTS ===`);
  console.log(`Total fetched: ${totalFetched}`);
  console.log(`Unique products: ${allProducts.size}`);
  console.log(`With EAN barcode: ${withEan.length}`);
  console.log(`Without EAN: ${withoutEan.length}`);

  // Category breakdown
  const categories = {};
  for (const [, prod] of allProducts) {
    const cat = prod.category_path ? prod.category_path.split('/')[0] : 'unknown';
    categories[cat] = (categories[cat] || 0) + 1;
  }
  console.log('\nCategories:');
  for (const [cat, count] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }

  // Save results
  const output = {
    scraped_at: new Date().toISOString(),
    source: 'super-pharm.co.il',
    total_unique: allProducts.size,
    with_ean: withEan.length,
    without_ean: withoutEan.length,
    products: [...allProducts.values()]
  };

  const outPath = 'C:/BENDA_PROJECT/ROOTS_BY_BENDA/04_SAFETY_DATA/superpharm_products.json';
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${outPath}`);
  console.log(`Finished: ${new Date().toISOString()}`);
}

scrapeAll().catch(e => { console.error('FATAL:', e); process.exit(1); });
