#!/usr/bin/env node
/**
 * Bridge Hebrew Academy Dictionary → Ingredient Names
 *
 * Matches hebrew_english_dict entries (chemistry, botany, medicine, biology, food)
 * to ingredient names in the benda-ingredients D1 database.
 * Generates SQL to add name_he column and populate it.
 */

const ACCOUNT_ID = 'a84205672ea899dde6bc13490945d274';
const API_TOKEN = 'v3MHDs6RU-dEtq1iP5V8wC3spvwDiP5LYuje29yx';
const INGREDIENTS_DB = '1f3b5be0-78c1-49e5-959a-8817b5ddebbf';
const FOOD_DB = 'c1b030b1-28be-4c0d-a250-0d942782c157';

import { writeFileSync } from 'fs';

async function queryD1(dbId, sql, params = []) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${dbId}/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql, params })
    }
  );
  const data = await res.json();
  if (!data.success) throw new Error(JSON.stringify(data.errors));
  return data.result[0]?.results || [];
}

async function main() {
  console.log('=== HEBREW-INGREDIENT BRIDGE ===');
  console.log(`Started: ${new Date().toISOString()}\n`);

  // Step 1: Fetch all hebrew_english_dict entries (relevant categories)
  console.log('--- Fetching Hebrew Academy dictionary ---');
  const categories = ['chemistry', 'botany', 'medicine', 'biology', 'food', 'environment', 'agriculture'];
  const dictEntries = [];

  for (const cat of categories) {
    let offset = 0;
    while (true) {
      const batch = await queryD1(FOOD_DB,
        `SELECT english, hebrew, hebrew_niqqud, category FROM hebrew_english_dict WHERE category = ? LIMIT 5000 OFFSET ?`,
        [cat, offset]
      );
      dictEntries.push(...batch);
      console.log(`  ${cat}: fetched ${batch.length} (total: ${dictEntries.length})`);
      if (batch.length < 5000) break;
      offset += 5000;
    }
  }

  console.log(`\nTotal dictionary entries: ${dictEntries.length}`);

  // Build lookup map: english_lower -> { hebrew, hebrew_niqqud, category }
  const dictMap = new Map();
  for (const e of dictEntries) {
    const key = (e.english || '').toLowerCase().trim();
    if (key.length > 1) {
      // Prefer chemistry/botany over general
      const existing = dictMap.get(key);
      const priority = { chemistry: 1, botany: 2, food: 3, medicine: 4, biology: 5, environment: 6, agriculture: 7 };
      if (!existing || (priority[e.category] || 99) < (priority[existing.category] || 99)) {
        dictMap.set(key, {
          hebrew: e.hebrew,
          hebrew_niqqud: e.hebrew_niqqud,
          category: e.category
        });
      }
    }
  }
  console.log(`Unique English terms in dict: ${dictMap.size}`);

  // Step 2: Fetch all ingredient names
  console.log('\n--- Fetching ingredient names ---');
  const ingredients = [];
  let offset = 0;
  while (true) {
    const batch = await queryD1(INGREDIENTS_DB,
      `SELECT id, name, inci, function FROM ingredients LIMIT 5000 OFFSET ?`,
      [offset]
    );
    ingredients.push(...batch);
    if (batch.length < 5000) break;
    offset += 5000;
  }
  console.log(`Total ingredients: ${ingredients.length}`);

  // Step 3: Also fetch cosmetic_functions_he for function-based Hebrew
  const funcHe = await queryD1(INGREDIENTS_DB,
    `SELECT function_en, function_he FROM cosmetic_functions_he`
  );
  const funcMap = new Map();
  for (const f of funcHe) {
    funcMap.set((f.function_en || '').toLowerCase(), f.function_he);
  }
  console.log(`Cosmetic function translations: ${funcMap.size}`);

  // Step 4: Match ingredients to Hebrew names
  console.log('\n--- Matching ---');
  const matches = [];
  const strategies = { exact: 0, inci: 0, words: 0, partial: 0 };

  for (const ing of ingredients) {
    const name = (ing.name || '').toLowerCase().trim();
    const inci = (ing.inci || '').toLowerCase().trim();
    let hebrewName = null;
    let matchType = null;

    // Strategy 1: Exact name match
    if (dictMap.has(name)) {
      hebrewName = dictMap.get(name).hebrew;
      matchType = 'exact';
    }
    // Strategy 2: INCI name match
    else if (inci && dictMap.has(inci)) {
      hebrewName = dictMap.get(inci).hebrew;
      matchType = 'inci';
    }
    // Strategy 3: Try individual words from multi-word names
    else {
      const words = name.split(/[\s,\-\/()]+/).filter(w => w.length > 3);
      // Try longest combinations first
      for (let len = words.length; len >= 1 && !hebrewName; len--) {
        for (let start = 0; start <= words.length - len && !hebrewName; start++) {
          const combo = words.slice(start, start + len).join(' ');
          if (dictMap.has(combo)) {
            hebrewName = dictMap.get(combo).hebrew;
            matchType = 'words';
          }
        }
      }

      // Strategy 4: Try common ingredient name patterns
      if (!hebrewName) {
        // "sodium benzoate" -> try "benzoate"
        // "cetyl alcohol" -> try "alcohol"
        const parts = name.split(/\s+/);
        if (parts.length >= 2) {
          // Try last word (often the chemical type)
          const lastWord = parts[parts.length - 1];
          if (dictMap.has(lastWord) && lastWord.length > 4) {
            hebrewName = dictMap.get(lastWord).hebrew;
            matchType = 'partial';
          }
          // Try without common prefixes
          const withoutPrefix = name.replace(/^(sodium|potassium|calcium|magnesium|zinc|iron|copper|aluminum|ammonium)\s+/i, '');
          if (withoutPrefix !== name && dictMap.has(withoutPrefix)) {
            hebrewName = dictMap.get(withoutPrefix).hebrew;
            matchType = 'partial';
          }
        }
      }
    }

    if (hebrewName) {
      matches.push({
        id: ing.id,
        name: ing.name,
        name_he: hebrewName,
        match_type: matchType
      });
      strategies[matchType] = (strategies[matchType] || 0) + 1;
    }
  }

  console.log(`\nMatched: ${matches.length} / ${ingredients.length} (${(matches.length / ingredients.length * 100).toFixed(1)}%)`);
  console.log('Strategy breakdown:');
  for (const [type, count] of Object.entries(strategies)) {
    console.log(`  ${type}: ${count}`);
  }

  // Step 5: Generate SQL
  console.log('\n--- Generating SQL ---');

  // First: ALTER TABLE to add name_he column if not exists
  const sqlStatements = [
    `-- Hebrew ingredient name bridge: ${matches.length} matches`,
    `-- Generated: ${new Date().toISOString()}`,
    `-- Strategy: exact=${strategies.exact}, inci=${strategies.inci}, words=${strategies.words}, partial=${strategies.partial}`,
    '',
    '-- Add name_he column (safe to run multiple times)',
    `ALTER TABLE ingredients ADD COLUMN name_he TEXT;`,
    ''
  ];

  // Generate UPDATE statements in batches
  for (const m of matches) {
    const escapedHe = m.name_he.replace(/'/g, "''");
    sqlStatements.push(
      `UPDATE ingredients SET name_he = '${escapedHe}' WHERE id = ${m.id}; -- ${m.name} [${m.match_type}]`
    );
  }

  const sqlPath = 'C:/BENDA_PROJECT/07_BATCHES/hebrew_ingredient_names.sql';
  writeFileSync(sqlPath, sqlStatements.join('\n'));
  console.log(`SQL saved to: ${sqlPath}`);
  console.log(`Total SQL statements: ${sqlStatements.length}`);

  // Also save match report as JSON
  const reportPath = 'C:/BENDA_PROJECT/07_BATCHES/hebrew_bridge_report.json';
  writeFileSync(reportPath, JSON.stringify({
    generated: new Date().toISOString(),
    total_ingredients: ingredients.length,
    total_matched: matches.length,
    match_rate: (matches.length / ingredients.length * 100).toFixed(1) + '%',
    strategies,
    sample_matches: matches.slice(0, 50),
    unmatched_sample: ingredients
      .filter(i => !matches.find(m => m.id === i.id))
      .slice(0, 50)
      .map(i => i.name)
  }, null, 2));
  console.log(`Report saved to: ${reportPath}`);

  console.log(`\nFinished: ${new Date().toISOString()}`);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
