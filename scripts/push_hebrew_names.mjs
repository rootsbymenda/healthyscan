#!/usr/bin/env node
/**
 * Push high-confidence Hebrew ingredient names to benda-ingredients D1
 */

import { readFileSync } from 'fs';

const ACCOUNT_ID = 'a84205672ea899dde6bc13490945d274';
const API_TOKEN = 'v3MHDs6RU-dEtq1iP5V8wC3spvwDiP5LYuje29yx';
const DB_ID = '1f3b5be0-78c1-49e5-959a-8817b5ddebbf';

async function queryD1(sql) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql })
    }
  );
  const data = await res.json();
  if (!data.success) {
    // Column already exists is OK
    const err = JSON.stringify(data.errors);
    if (err.includes('duplicate column')) return 'already_exists';
    throw new Error(err);
  }
  return data.result;
}

async function main() {
  console.log('=== PUSH HEBREW INGREDIENT NAMES ===\n');

  // Step 1: Add name_he column
  console.log('Adding name_he column...');
  try {
    const result = await queryD1('ALTER TABLE ingredients ADD COLUMN name_he TEXT');
    console.log('  Column added (or already exists)');
  } catch (e) {
    if (e.message.includes('duplicate')) {
      console.log('  Column already exists');
    } else {
      console.error('  Error:', e.message);
    }
  }

  // Step 2: Read SQL file
  const sql = readFileSync('C:/BENDA_PROJECT/07_BATCHES/hebrew_names_highconf.sql', 'utf8');
  const statements = sql.split('\n').filter(l => l.startsWith('UPDATE'));
  console.log(`\nLoaded ${statements.length} UPDATE statements`);

  // Step 3: Push in batches of 20 (D1 limit)
  const BATCH_SIZE = 20;
  let pushed = 0;
  let errors = 0;

  for (let i = 0; i < statements.length; i += BATCH_SIZE) {
    const batch = statements.slice(i, i + BATCH_SIZE);

    try {
      // D1 batch API - send multiple statements
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sql: batch.join('\n') })
        }
      );
      const data = await res.json();

      if (data.success) {
        pushed += batch.length;
      } else {
        // Try one by one
        for (const stmt of batch) {
          try {
            await queryD1(stmt);
            pushed++;
          } catch {
            errors++;
          }
        }
      }
    } catch {
      // Try one by one on network error
      for (const stmt of batch) {
        try {
          await queryD1(stmt);
          pushed++;
        } catch {
          errors++;
        }
      }
    }

    if ((i + BATCH_SIZE) % 100 === 0 || i + BATCH_SIZE >= statements.length) {
      console.log(`  ${Math.min(i + BATCH_SIZE, statements.length)}/${statements.length} (${pushed} ok, ${errors} err)`);
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Pushed: ${pushed}/${statements.length}`);
  console.log(`Errors: ${errors}`);

  // Verify
  const verify = await queryD1("SELECT COUNT(*) as cnt FROM ingredients WHERE name_he IS NOT NULL AND name_he != ''");
  console.log(`Verified in DB: ${verify[0]?.results?.[0]?.cnt || 'unknown'} ingredients with Hebrew names`);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
