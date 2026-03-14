#!/usr/bin/env node
/**
 * Push SQL file to D1 in batches via wrangler --command
 * Workaround for --file import API auth issues
 *
 * Note: Uses execSync with hardcoded wrangler commands only (no user input).
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sqlFile = process.argv[2];
if (!sqlFile) {
    console.error('Usage: node push-sql-batched.js <sql-file>');
    process.exit(1);
}

const content = fs.readFileSync(sqlFile, 'utf8');
const cwd = path.join(__dirname, '..');

// Split into individual statements (skip comments and empty lines)
const statements = content
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('--') && !l.startsWith('//'));

console.log(`Total statements: ${statements.length}`);

// Push each statement individually via temp file (avoids shell escaping)
const BATCH_SIZE = 15;
let success = 0;
let errors = 0;
const tmpFile = path.join(__dirname, '_tmp_batch.sql');

for (let i = 0; i < statements.length; i += BATCH_SIZE) {
    const batch = statements.slice(i, i + BATCH_SIZE);
    const sql = batch.join('\n');

    try {
        fs.writeFileSync(tmpFile, sql);
        execFileSync('wrangler', [
            'd1', 'execute', 'benda-ingredients',
            '--remote', `--file=${tmpFile}`
        ], { cwd, stdio: 'pipe', timeout: 30000 });
        success += batch.length;
    } catch (e) {
        // If batch fails, try individual statements
        for (const stmt of batch) {
            try {
                fs.writeFileSync(tmpFile, stmt);
                execFileSync('wrangler', [
                    'd1', 'execute', 'benda-ingredients',
                    '--remote', `--file=${tmpFile}`
                ], { cwd, stdio: 'pipe', timeout: 30000 });
                success++;
            } catch (e2) {
                errors++;
                console.error(`\nFailed: ${stmt.substring(0, 100)}...`);
                console.error(`  Error: ${e2.message.substring(0, 200)}`);
            }
        }
    }
    process.stdout.write(`\r[${Math.round((i + batch.length) / statements.length * 100)}%] ${success}/${statements.length} pushed (${errors} errors)`);
}

// Cleanup
try { fs.unlinkSync(tmpFile); } catch(e) {}

console.log(`\n\nDone! ${success} succeeded, ${errors} failed out of ${statements.length}`);
