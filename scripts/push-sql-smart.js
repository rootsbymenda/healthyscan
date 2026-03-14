#!/usr/bin/env node
/**
 * Smart SQL pusher - handles multi-line statements
 * Joins lines until semicolon, then pushes via temp file
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sqlFile = process.argv[2];
if (!sqlFile) {
    console.error('Usage: node push-sql-smart.js <sql-file>');
    process.exit(1);
}

const content = fs.readFileSync(sqlFile, 'utf8');
const cwd = path.join(__dirname, '..');

// Parse into complete statements (join until semicolon)
const statements = [];
let current = '';
for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('//')) continue;
    current += (current ? ' ' : '') + trimmed;
    if (trimmed.endsWith(';')) {
        statements.push(current);
        current = '';
    }
}
if (current.trim()) statements.push(current); // Last statement without semicolon

console.log(`Total statements: ${statements.length}`);

const BATCH_SIZE = 10;
let success = 0;
let errors = 0;
const tmpFile = path.join(__dirname, '_tmp_push.sql');
const wrangler = path.join(process.env.APPDATA || '', 'npm', 'node_modules', 'wrangler', 'bin', 'wrangler.js');

for (let i = 0; i < statements.length; i += BATCH_SIZE) {
    const batch = statements.slice(i, i + BATCH_SIZE);
    const sql = batch.join('\n');

    try {
        fs.writeFileSync(tmpFile, sql);
        execFileSync('node', [
            wrangler, 'd1', 'execute', 'benda-ingredients',
            '--remote', `--file=${tmpFile}`
        ], { cwd, stdio: 'pipe', timeout: 30000 });
        success += batch.length;
    } catch (e) {
        // If batch fails, try individual statements
        for (const stmt of batch) {
            try {
                fs.writeFileSync(tmpFile, stmt);
                execFileSync('node', [
                    wrangler, 'd1', 'execute', 'benda-ingredients',
                    '--remote', `--file=${tmpFile}`
                ], { cwd, stdio: 'pipe', timeout: 30000 });
                success++;
            } catch (e2) {
                errors++;
                console.error(`\nFailed: ${stmt.substring(0, 120)}...`);
                const stderr = e2.stderr ? e2.stderr.toString().substring(0, 200) : e2.message.substring(0, 200);
                console.error(`  Error: ${stderr}`);
            }
        }
    }
    process.stdout.write(`\r[${Math.round((i + batch.length) / statements.length * 100)}%] ${success}/${statements.length} pushed (${errors} errors)`);
}

// Cleanup
try { fs.unlinkSync(tmpFile); } catch(e) {}

console.log(`\n\nDone! ${success} succeeded, ${errors} failed out of ${statements.length}`);
