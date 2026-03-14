/**
 * Generate SQL files from "Israeli Food & Cosmetics Ingredients Database.json"
 * exported-assets (29) ZIP
 *
 * Sheets:
 *  1. Top 200 Food Additives -> UPDATE food_additives (hebrew_name, frequency, israeli_products)
 *  2. E-Numbers Hebrew (E100-E1521) -> UPDATE food_additives (hebrew_name, moh_approved)
 *  3. Cosmetic Functions Hebrew -> CREATE + INSERT cosmetic_functions_he
 */

const fs = require('fs');
const path = require('path');

const jsonPath = path.join(
  'C:/BENDA_PROJECT/ROOTS_BY_BENDA/11_INBOX/27.2.2/extracted',
  'Israeli Food & Cosmetics Ingredients Database.json'
);

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const outDir = path.join('C:/BENDA_PROJECT/HEALTHYSCAN/scripts/sql');
fs.mkdirSync(outDir, { recursive: true });

function escSql(val) {
  if (val === null || val === undefined) return '';
  return String(val).replace(/'/g, "''");
}

// ============================================================
// PART 0: Schema migrations (add new columns)
// ============================================================
const schemaSql = [];
schemaSql.push(`-- Schema migrations for exported-assets (29)`);
schemaSql.push(`-- Add new columns to food_additives if they don't exist`);
schemaSql.push(`-- SQLite doesn't have IF NOT EXISTS for ALTER TABLE, so these may fail if already added`);
schemaSql.push(`ALTER TABLE food_additives ADD COLUMN frequency TEXT DEFAULT '';`);
schemaSql.push(`ALTER TABLE food_additives ADD COLUMN israeli_products TEXT DEFAULT '';`);
schemaSql.push(`ALTER TABLE food_additives ADD COLUMN category_he TEXT DEFAULT '';`);
schemaSql.push(`ALTER TABLE food_additives ADD COLUMN moh_approved TEXT DEFAULT '';`);
schemaSql.push(`ALTER TABLE food_additives ADD COLUMN tech_function TEXT DEFAULT '';`);

fs.writeFileSync(path.join(outDir, '00-schema.sql'), schemaSql.join('\n'));
console.log('Generated 00-schema.sql with', schemaSql.length - 3, 'ALTER statements');

// ============================================================
// PART 1: Top 200 Food Additives
// ============================================================
const sheet1 = data.sheets.find(s => s.name === 'Top 200 Food Additives');
const top200Rows = sheet1.rows.slice(1); // skip header

const updateSql = [];
const insertSql = [];

updateSql.push(`-- Top 200 Food Additives: UPDATE existing entries with Hebrew data`);
insertSql.push(`-- Top 200 Food Additives: INSERT new entries that don't exist by e_number`);

let updateCount = 0;
let insertCount = 0;

for (const row of top200Rows) {
  const [rank, eNumber, engName, hebName, catEn, catHe, frequency, products] = row;

  if (!eNumber || !eNumber.trim()) continue;

  const eNum = escSql(eNumber.trim());
  const hName = escSql(hebName || '');
  const cHe = escSql(catHe || '');
  const freq = escSql(frequency || '');
  const prods = escSql(products || '');
  const cEn = escSql(catEn || '');
  const eName = escSql(engName || '');

  // UPDATE: set hebrew_name (only if currently empty), category_he, frequency, israeli_products
  updateSql.push(
    `UPDATE food_additives SET ` +
    `hebrew_name = CASE WHEN hebrew_name = '' OR hebrew_name IS NULL THEN '${hName}' ELSE hebrew_name END, ` +
    `category_he = '${cHe}', ` +
    `frequency = '${freq}', ` +
    `israeli_products = '${prods}' ` +
    `WHERE e_number = '${eNum}';`
  );
  updateCount++;

  // INSERT: only if e_number AND common_name don't exist (UNIQUE on common_name COLLATE NOCASE)
  insertSql.push(
    `INSERT INTO food_additives (e_number, common_name, category, hebrew_name, category_he, frequency, israeli_products) ` +
    `SELECT '${eNum}', '${eName}', '${cEn}', '${hName}', '${cHe}', '${freq}', '${prods}' ` +
    `WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE e_number = '${eNum}') ` +
    `AND NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = '${eName}' COLLATE NOCASE);`
  );
  insertCount++;
}

fs.writeFileSync(path.join(outDir, '01-top200-updates.sql'), updateSql.join('\n'));
fs.writeFileSync(path.join(outDir, '02-top200-inserts.sql'), insertSql.join('\n'));
console.log(`Generated 01-top200-updates.sql (${updateCount} UPDATE statements)`);
console.log(`Generated 02-top200-inserts.sql (${insertCount} conditional INSERT statements)`);

// ============================================================
// PART 2: E-Numbers Hebrew (E100-E1521) — 283 rows
// ============================================================
const sheet2 = data.sheets.find(s => s.name.includes('E-Numbers Hebrew'));
const eNumRows = sheet2.rows.slice(1); // skip header

const eNumUpdateSql = [];
const eNumInsertSql = [];

eNumUpdateSql.push(`-- E-Numbers Hebrew: UPDATE existing entries with Hebrew name and MOH status`);
eNumInsertSql.push(`-- E-Numbers Hebrew: INSERT new entries that don't exist`);

let eNumUpdateCount = 0;
let eNumInsertCount = 0;

for (const row of eNumRows) {
  const [eNumber, engName, hebName, catEn, catHe, techFunc, mohApproved, notes] = row;

  if (!eNumber || !eNumber.trim()) continue;

  const eNum = escSql(eNumber.trim());
  const hName = escSql(hebName || '');
  const cHe = escSql(catHe || '');
  const cEn = escSql(catEn || '');
  const tFunc = escSql(techFunc || '');
  const moh = escSql(mohApproved || '');
  const eName = escSql(engName || '');
  const n = escSql(notes || '');

  // UPDATE: hebrew_name (only if empty), moh_approved, tech_function, category_he
  eNumUpdateSql.push(
    `UPDATE food_additives SET ` +
    `hebrew_name = CASE WHEN hebrew_name = '' OR hebrew_name IS NULL THEN '${hName}' ELSE hebrew_name END, ` +
    `moh_approved = '${moh}', ` +
    `tech_function = '${tFunc}', ` +
    `category_he = CASE WHEN category_he = '' OR category_he IS NULL THEN '${cHe}' ELSE category_he END ` +
    `WHERE e_number = '${eNum}';`
  );
  eNumUpdateCount++;

  // INSERT: only if e_number AND common_name don't exist
  eNumInsertSql.push(
    `INSERT INTO food_additives (e_number, common_name, category, hebrew_name, category_he, moh_approved, tech_function) ` +
    `SELECT '${eNum}', '${eName}', '${cEn}', '${hName}', '${cHe}', '${moh}', '${tFunc}' ` +
    `WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE e_number = '${eNum}') ` +
    `AND NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = '${eName}' COLLATE NOCASE);`
  );
  eNumInsertCount++;
}

fs.writeFileSync(path.join(outDir, '03-enumbers-updates.sql'), eNumUpdateSql.join('\n'));
fs.writeFileSync(path.join(outDir, '04-enumbers-inserts.sql'), eNumInsertSql.join('\n'));
console.log(`Generated 03-enumbers-updates.sql (${eNumUpdateCount} UPDATE statements)`);
console.log(`Generated 04-enumbers-inserts.sql (${eNumInsertCount} conditional INSERT statements)`);

// Also update il_permitted_additives status for "No" or "Restricted" MOH entries
const mohStatusSql = [];
mohStatusSql.push(`-- Update il_permitted_additives with MOH approval data from spreadsheet`);
let mohStatusCount = 0;

for (const row of eNumRows) {
  const [eNumber, engName, hebName, catEn, catHe, techFunc, mohApproved, notes] = row;
  if (!eNumber || !eNumber.trim()) continue;

  const eNum = escSql(eNumber.trim());
  const moh = (mohApproved || '').trim();
  const n = escSql(notes || '');

  // Map MOH approved field to il_permitted_additives status
  let newStatus = '';
  if (moh === 'No' || moh === 'no') {
    newStatus = 'banned';
  } else if (moh === 'Restricted' || moh === 'restricted' || moh.toLowerCase().includes('restrict')) {
    newStatus = 'restricted';
  } else if (moh === 'Yes' || moh === 'yes') {
    newStatus = 'permitted';
  }

  if (newStatus) {
    mohStatusSql.push(
      `UPDATE il_permitted_additives SET status = '${newStatus}'` +
      (n ? `, notes = '${escSql(n)}'` : '') +
      ` WHERE e_number = '${eNum}';`
    );
    mohStatusCount++;

    // Also INSERT if not exists in il_permitted_additives
    mohStatusSql.push(
      `INSERT OR IGNORE INTO il_permitted_additives (e_number, name_en, status, notes) ` +
      `VALUES ('${eNum}', '${escSql(engName || '')}', '${newStatus}', '${escSql(n)}');`
    );
  }
}

fs.writeFileSync(path.join(outDir, '05-moh-status.sql'), mohStatusSql.join('\n'));
console.log(`Generated 05-moh-status.sql (${mohStatusCount} MOH status updates)`);

// ============================================================
// PART 3: Cosmetic Functions Hebrew — 20 rows
// ============================================================
const sheet3 = data.sheets.find(s => s.name === 'Cosmetic Functions Hebrew');
const cosmeticRows = sheet3.rows.slice(1); // skip header

const cosmeticSql = [];
cosmeticSql.push(`-- Cosmetic Functions Hebrew: Create table and insert 20 rows`);
cosmeticSql.push(`CREATE TABLE IF NOT EXISTS cosmetic_functions_he (`);
cosmeticSql.push(`  id INTEGER PRIMARY KEY AUTOINCREMENT,`);
cosmeticSql.push(`  function_en TEXT NOT NULL,`);
cosmeticSql.push(`  function_he TEXT DEFAULT '',`);
cosmeticSql.push(`  consumer_desc_he TEXT DEFAULT '',`);
cosmeticSql.push(`  consumer_desc_he_alt TEXT DEFAULT '',`);
cosmeticSql.push(`  inci_examples TEXT DEFAULT '',`);
cosmeticSql.push(`  inci_examples_he TEXT DEFAULT '',`);
cosmeticSql.push(`  app_display_category TEXT DEFAULT '',`);
cosmeticSql.push(`  created_at TEXT DEFAULT (datetime('now'))`);
cosmeticSql.push(`);`);

let cosmeticCount = 0;

for (const row of cosmeticRows) {
  const [funcEn, funcHe, consDesc, consDescAlt, inciEx, inciExHe, appCat] = row;

  if (!funcEn || !funcEn.trim()) continue;

  cosmeticSql.push(
    `INSERT INTO cosmetic_functions_he (function_en, function_he, consumer_desc_he, consumer_desc_he_alt, inci_examples, inci_examples_he, app_display_category) ` +
    `VALUES ('${escSql(funcEn)}', '${escSql(funcHe || '')}', '${escSql(consDesc || '')}', '${escSql(consDescAlt || '')}', '${escSql(inciEx || '')}', '${escSql(inciExHe || '')}', '${escSql(appCat || '')}');`
  );
  cosmeticCount++;
}

fs.writeFileSync(path.join(outDir, '06-cosmetic-functions.sql'), cosmeticSql.join('\n'));
console.log(`Generated 06-cosmetic-functions.sql (${cosmeticCount} INSERT statements)`);

// ============================================================
// Summary
// ============================================================
console.log('\n=== SUMMARY ===');
console.log(`Top 200: ${updateCount} updates + ${insertCount} conditional inserts`);
console.log(`E-Numbers: ${eNumUpdateCount} updates + ${eNumInsertCount} conditional inserts`);
console.log(`MOH Status: ${mohStatusCount} status updates`);
console.log(`Cosmetic Functions: ${cosmeticCount} inserts`);
console.log(`\nSQL files written to: ${outDir}`);
