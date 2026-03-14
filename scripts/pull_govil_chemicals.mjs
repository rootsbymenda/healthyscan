#!/usr/bin/env node
/**
 * Pull chemical safety lists from data.gov.il
 * 1. Chemical Import Licenses (117 records)
 * 2. Domestic Pesticides with active ingredients (167 records)
 * 3. MAFLAS Pollutant Names EN+HE (extract unique chemicals)
 */

import { writeFileSync } from 'fs';

const GOVIL_API = 'https://data.gov.il/api/3/action/datastore_search';

async function fetchAll(resourceId, label) {
  const records = [];
  let offset = 0;
  const limit = 5000;

  while (true) {
    const url = `${GOVIL_API}?resource_id=${resourceId}&limit=${limit}&offset=${offset}`;
    console.log(`  Fetching ${label} offset=${offset}...`);
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`  HTTP ${res.status}`);
      break;
    }
    const data = await res.json();
    const batch = data.result?.records || [];
    records.push(...batch);

    if (batch.length < limit) break;
    offset += limit;
  }

  console.log(`  Total: ${records.length} records`);
  return records;
}

async function main() {
  console.log('=== DATA.GOV.IL CHEMICAL SAFETY LISTS ===');
  console.log(`Started: ${new Date().toISOString()}\n`);

  // 1. Chemical Import Licenses
  console.log('--- Chemical Import Licenses ---');
  const chemicals = await fetchAll('76be9404-9ba2-480d-b728-9801aec0a8bc', 'chemical_licenses');
  writeFileSync(
    'C:/BENDA_PROJECT/ROOTS_BY_BENDA/04_SAFETY_DATA/data_gov_il/chemical_import_licenses.json',
    JSON.stringify(chemicals, null, 2)
  );

  // 2. Domestic Pesticides (consumer use)
  console.log('\n--- Domestic Pesticides ---');
  const pesticides = await fetchAll('2d741cd4-9c54-492c-8607-933deddb3094', 'domestic_pesticides');
  writeFileSync(
    'C:/BENDA_PROJECT/ROOTS_BY_BENDA/04_SAFETY_DATA/data_gov_il/domestic_pesticides.json',
    JSON.stringify(pesticides, null, 2)
  );

  // Extract unique active ingredients from pesticides
  const activeIngredients = new Set();
  for (const p of pesticides) {
    const ingredients = p['חומרים פעילים'] || p['active_ingredients'] || '';
    // Parse "lambda-cyhalothrin 0.025%" format
    const parts = ingredients.split(/[,;+]/);
    for (const part of parts) {
      const name = part.replace(/[\d.]+\s*%/g, '').trim();
      if (name.length > 2) activeIngredients.add(name);
    }
  }
  console.log(`  Unique active ingredients: ${activeIngredients.size}`);

  // 3. MAFLAS Pollutant Registry (large file — just get unique pollutant names)
  console.log('\n--- MAFLAS Pollutant Names ---');
  // This is 167MB so we only fetch first batch to get unique pollutant names
  const pollutants = [];
  let offset = 0;
  const seen = new Set();

  while (true) {
    const url = `${GOVIL_API}?resource_id=87c88ab8-3076-4422-a8fb-27bc57ce4b76&limit=5000&offset=${offset}&fields=MezahemBeplitaEng,MezahemBeplitaHeb,KodMezahem`;
    console.log(`  Fetching pollutants offset=${offset}...`);
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`  HTTP ${res.status}`);
      break;
    }
    const data = await res.json();
    const batch = data.result?.records || [];

    for (const r of batch) {
      const key = r.KodMezahem || r.MezahemBeplitaEng;
      if (key && !seen.has(key)) {
        seen.add(key);
        pollutants.push({
          code: r.KodMezahem || null,
          name_en: r.MezahemBeplitaEng || null,
          name_he: r.MezahemBeplitaHeb || null
        });
      }
    }

    console.log(`  ${batch.length} records, ${pollutants.length} unique pollutants so far`);

    if (batch.length < 5000) break;
    offset += 5000;

    // Cap at 100K records to avoid timeout
    if (offset > 100000) {
      console.log('  Capped at 100K records');
      break;
    }
  }

  writeFileSync(
    'C:/BENDA_PROJECT/ROOTS_BY_BENDA/04_SAFETY_DATA/data_gov_il/pollutant_chemicals.json',
    JSON.stringify(pollutants, null, 2)
  );

  console.log(`\n=== SUMMARY ===`);
  console.log(`Chemical import licenses: ${chemicals.length}`);
  console.log(`Domestic pesticides: ${pesticides.length}`);
  console.log(`  Active ingredients extracted: ${activeIngredients.size}`);
  console.log(`Unique pollutants (EN+HE): ${pollutants.length}`);
  console.log(`\nAll saved to: C:/BENDA_PROJECT/ROOTS_BY_BENDA/04_SAFETY_DATA/data_gov_il/`);
  console.log(`Finished: ${new Date().toISOString()}`);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
