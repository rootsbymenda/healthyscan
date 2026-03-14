#!/usr/bin/env node
/**
 * Mine unique ingredients from scraped Shufersal products
 * Cross-reference against existing food_additives + food_aliases
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'data', 'shufersal', 'products');
const files = fs.readdirSync(dir);

let total = 0, withIngredients = 0, withAllergens = 0, withNutrition = 0;
const allIngredients = new Map(); // ingredient -> count

for (const f of files) {
    if (!f.endsWith('.json')) continue;
    total++;
    try {
        const p = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        if (p.ingredients_raw) {
            withIngredients++;
            // Parse ingredients (comma-separated)
            const parts = p.ingredients_raw.split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 1);
            for (const part of parts) {
                allIngredients.set(part, (allIngredients.get(part) || 0) + 1);
            }
        }
        if (p.allergens) withAllergens++;
        if (p.nutrition_per_100g && p.nutrition_per_100g.calories !== null) withNutrition++;
    } catch(e) {}
}

console.log('=== Shufersal Ingredient Mining ===');
console.log('Total products:', total);
console.log('With ingredients:', withIngredients, '(' + Math.round(withIngredients/total*100) + '%)');
console.log('With allergens:', withAllergens);
console.log('With nutrition:', withNutrition);
console.log('Unique ingredients:', allIngredients.size);

// Now cross-reference against existing DB entries
// Parse SQL files to get known entries
const sqlDir = path.join(__dirname, 'sql');
const knownNames = new Set();
const knownHebrew = new Set();
const knownAliases = new Set();

// Parse food_additives from SQL files
for (const sqlFile of ['02-top200-additives.sql', '04-e-numbers-comprehensive.sql', '07-hebrew-food-aliases.sql']) {
    const fp = path.join(sqlDir, sqlFile);
    if (!fs.existsSync(fp)) continue;
    const content = fs.readFileSync(fp, 'utf8');

    // Match common_name from SELECT format
    const selectMatches = content.matchAll(/SELECT\s+'[^']*'\s*,\s*'([^']+)'/gi);
    for (const m of selectMatches) {
        knownNames.add(m[1].toLowerCase());
    }

    // Match hebrew_name from SELECT format (4th field)
    const hebrewMatches = content.matchAll(/SELECT\s+'[^']*'\s*,\s*'[^']*'\s*,\s*'[^']*'\s*,\s*'([^']+)'/gi);
    for (const m of hebrewMatches) {
        if (m[1]) knownHebrew.add(m[1].toLowerCase());
    }

    // Match aliases
    const aliasMatches = content.matchAll(/INSERT\s+OR\s+IGNORE\s+INTO\s+food_aliases[^']*'([^']+)'/gi);
    for (const m of aliasMatches) {
        knownAliases.add(m[1].toLowerCase());
    }
}

// Also parse 07a update file
const updateFile = path.join(sqlDir, '07a-update-hebrew-names.sql');
if (fs.existsSync(updateFile)) {
    const content = fs.readFileSync(updateFile, 'utf8');
    const hebrewMatches = content.matchAll(/hebrew_name\s*=\s*'([^']+)'/gi);
    for (const m of hebrewMatches) {
        knownHebrew.add(m[1].toLowerCase());
    }
}

console.log('\nKnown DB entries:');
console.log('  common_names:', knownNames.size);
console.log('  hebrew_names:', knownHebrew.size);
console.log('  aliases:', knownAliases.size);

// Cross-reference
const sorted = [...allIngredients.entries()].sort((a,b) => b[1] - a[1]);
const matched = [];
const unmatched = [];

for (const [name, count] of sorted) {
    const clean = name.replace(/^["'\s]+/, '').replace(/[)}\]"'\s]+$/, '').trim();
    if (knownNames.has(clean) || knownHebrew.has(clean) || knownAliases.has(clean)) {
        matched.push({ name: clean, count });
    } else {
        unmatched.push({ name: clean, count });
    }
}

console.log('\nMatched:', matched.length, '/', sorted.length, '(' + Math.round(matched.length/sorted.length*100) + '%)');
console.log('Unmatched:', unmatched.length);

console.log('\n=== Top 30 MATCHED ingredients ===');
for (const { name, count } of matched.slice(0, 30)) {
    console.log('  ' + count + 'x  ' + name);
}

console.log('\n=== Top 80 UNMATCHED ingredients ===');
for (const { name, count } of unmatched.slice(0, 80)) {
    console.log('  ' + count + 'x  ' + name);
}

// Save full report
const report = {
    stats: { total, withIngredients, withAllergens, withNutrition, uniqueIngredients: allIngredients.size },
    matched: matched.length,
    unmatched: unmatched.length,
    topUnmatched: unmatched.slice(0, 200),
    topMatched: matched.slice(0, 100)
};
const reportPath = path.join(__dirname, '..', 'data', 'shufersal-ingredient-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log('\nFull report saved to:', reportPath);
