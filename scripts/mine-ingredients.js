#!/usr/bin/env node
/**
 * Ingredient Gap Analyzer
 *
 * Mines all ingredients from Hazi Hinam products,
 * cross-references against existing food_additives DB entries,
 * identifies missing ingredients that show as "לא במאגר".
 */

const fs = require('fs');
const path = require('path');

// ── 1. Parse existing DB entries from SQL files ──────────────────
function parseExistingAdditives() {
    const known = new Set();
    const sqlDir = path.join(__dirname, 'sql');

    const sqlFiles = ['02-top200-inserts.sql', '04-enumbers-inserts.sql'];
    const hebrewNames = new Map(); // english → hebrew

    for (const file of sqlFiles) {
        const filePath = path.join(sqlDir, file);
        if (!fs.existsSync(filePath)) continue;
        const content = fs.readFileSync(filePath, 'utf8');

        // Format: INSERT INTO food_additives (...) SELECT 'E100', 'Curcumin', 'Color', 'כורכומין', ...
        const re = /SELECT\s+'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'/g;
        let m;
        while ((m = re.exec(content)) !== null) {
            const eNumber = m[1];    // E100
            const commonName = m[2]; // Curcumin
            const category = m[3];   // Color
            const hebrewName = m[4]; // כורכומין

            known.add(commonName.toLowerCase());
            known.add(eNumber.toLowerCase());
            if (hebrewName) {
                known.add(hebrewName.toLowerCase());
                hebrewNames.set(commonName.toLowerCase(), hebrewName);
            }
        }
    }

    return { known, hebrewNames };
}

// ── 2. Parse the HEBREW_INGREDIENT_NAMES map from food-scan.js ──
function parseHardcodedNames() {
    const names = new Set();
    const hardcoded = [
        'sugar', 'salt', 'water', 'flour', 'wheat flour', 'corn starch', 'rice',
        'milk', 'cream', 'butter', 'eggs', 'egg', 'honey', 'vinegar', 'yeast',
        'palm oil', 'sunflower oil', 'olive oil', 'canola oil', 'soybean oil',
        'coconut oil', 'vegetable oil', 'corn oil',
        'tomato', 'tomatoes', 'tomato paste', 'onion', 'garlic', 'pepper', 'paprika',
        'cinnamon', 'turmeric', 'ginger', 'lemon', 'lemon juice', 'orange',
        'chocolate', 'cocoa', 'cocoa powder', 'vanilla', 'vanilla extract',
        'gelatin', 'pectin', 'starch', 'modified starch', 'corn syrup',
        'glucose syrup', 'fructose', 'sucrose', 'lactose', 'maltose', 'dextrose', 'glucose',
        'soy', 'soy lecithin', 'soybean', 'peanuts', 'peanut', 'almonds',
        'walnuts', 'hazelnuts', 'cashews', 'sesame', 'sesame seeds',
        'wheat', 'barley', 'oats', 'rye', 'corn', 'maize', 'potato',
        'sodium chloride', 'acetic acid', 'baking soda', 'sodium bicarbonate',
        'calcium carbonate', 'iron', 'protein', 'whey', 'whey protein',
        'casein', 'gluten', 'vitamins', 'minerals',
        'preservative', 'coloring', 'flavoring', 'natural flavoring', 'artificial flavoring',
        'citric acid', 'ascorbic acid', 'lactic acid', 'phosphoric acid',
        'mono and diglycerides',
    ];
    for (const n of hardcoded) names.add(n.toLowerCase());
    return names;
}

// ── 3. Extract ingredients from Hazi Hinam SQL ──────────────────
function extractHaziHinamIngredients() {
    const sqlPath = path.join('C:', 'BENDA_PROJECT', 'ROOTS_BY_BENDA', 'sql_hazi_hinam', 'mega_push_hazi_hinam.sql');
    const content = fs.readFileSync(sqlPath, 'utf8');

    const allIngredients = new Map();
    let foodProducts = 0;
    let emptyIngredients = 0;
    let nonFoodProducts = 0;

    const rowRe = /INSERT\s+OR\s+REPLACE\s+INTO\s+off_products\s*\([^)]+\)\s*VALUES\s*\(([^;]+)\);/gi;
    let m;
    while ((m = rowRe.exec(content)) !== null) {
        const valStr = m[1];
        const fields = splitSQLValues(valStr);
        if (fields.length < 6) continue;

        const categories = unquote(fields[4]);
        const ingredientsText = unquote(fields[5]);

        const isFood = !categories.includes('היגיינה') && !categories.includes('ניקיון') &&
                        !categories.includes('כלי בית') && !categories.includes('חד פעמי');

        if (!isFood) {
            nonFoodProducts++;
            continue;
        }

        foodProducts++;

        if (!ingredientsText || ingredientsText.trim().length === 0) {
            emptyIngredients++;
            continue;
        }

        const ingredients = ingredientsText
            .replace(/\.\s*$/, '')
            .split(/,\s*/)
            .map(s => s.trim())
            .filter(s => s.length > 0 && s.length < 200);

        for (const ing of ingredients) {
            const clean = ing.replace(/\s+/g, ' ').trim().toLowerCase();
            if (clean.length < 2) continue;
            allIngredients.set(clean, (allIngredients.get(clean) || 0) + 1);
        }
    }

    return { allIngredients, foodProducts, emptyIngredients, nonFoodProducts };
}

function splitSQLValues(str) {
    const fields = [];
    let current = '';
    let inQuote = false;

    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (ch === "'" && !inQuote) {
            inQuote = true;
            current += ch;
        } else if (ch === "'" && inQuote) {
            if (i + 1 < str.length && str[i + 1] === "'") {
                current += "''";
                i++;
            } else {
                inQuote = false;
                current += ch;
            }
        } else if (ch === ',' && !inQuote) {
            fields.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    if (current.trim()) fields.push(current.trim());
    return fields;
}

function unquote(s) {
    if (!s) return '';
    s = s.trim();
    if (s.startsWith("'") && s.endsWith("'")) {
        s = s.slice(1, -1);
    }
    return s.replace(/''/g, "'");
}

// ── 4. Check scraped Shufersal products if available ──────────────
function extractShufersalIngredients() {
    const productsDir = path.join('C:', 'BENDA_PROJECT', 'HEALTHYSCAN', 'data', 'shufersal', 'products');
    if (!fs.existsSync(productsDir)) return new Map();

    const allIngredients = new Map();
    let count = 0;

    const files = fs.readdirSync(productsDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(productsDir, file), 'utf8'));
            if (!data.ingredients) continue;
            count++;

            const ingredients = data.ingredients
                .split(/,\s*/)
                .map(s => s.trim().toLowerCase())
                .filter(s => s.length > 1 && s.length < 200);

            for (const ing of ingredients) {
                allIngredients.set(ing, (allIngredients.get(ing) || 0) + 1);
            }
        } catch (e) {}
    }

    console.log(`\n📦 Shufersal: ${count} products with ingredients (${files.length} total scraped so far)`);
    return allIngredients;
}

// ── MAIN ──────────────────────────────────────────────────────────
function main() {
    console.log('═══ INGREDIENT GAP ANALYZER ═══\n');

    const { known: knownAdditives, hebrewNames } = parseExistingAdditives();
    const hardcodedNames = parseHardcodedNames();
    console.log(`✅ Known food_additives in DB: ${knownAdditives.size} (incl. ${hebrewNames.size} Hebrew names)`);
    console.log(`✅ Hardcoded HEBREW_INGREDIENT_NAMES: ${hardcodedNames.size}`);

    const hazi = extractHaziHinamIngredients();
    console.log(`\n📦 Hazi Hinam stats:`);
    console.log(`   Food products: ${hazi.foodProducts}`);
    console.log(`   Non-food (hygiene/cleaning): ${hazi.nonFoodProducts}`);
    console.log(`   Empty ingredients: ${hazi.emptyIngredients}`);
    console.log(`   Unique ingredients found: ${hazi.allIngredients.size}`);

    const shufersal = extractShufersalIngredients();

    const combined = new Map();
    for (const [k, v] of hazi.allIngredients) combined.set(k, (combined.get(k) || 0) + v);
    for (const [k, v] of shufersal) combined.set(k, (combined.get(k) || 0) + v);

    console.log(`\n📊 Total unique ingredients across all sources: ${combined.size}`);

    const matched = [];
    const unmatched = [];
    const hardcodedOnly = [];

    for (const [ingredient, count] of combined) {
        const cleanIng = ingredient.replace(/\s+/g, ' ').trim();

        if (knownAdditives.has(cleanIng)) {
            matched.push({ name: cleanIng, count, source: 'food_additives' });
        } else if (hardcodedNames.has(cleanIng)) {
            hardcodedOnly.push({ name: cleanIng, count, source: 'hardcoded_only' });
        } else {
            const eMatch = cleanIng.match(/^e\s?(\d{3,4}[a-z]?)$/i);
            if (eMatch) {
                const normalized = 'e' + eMatch[1].toLowerCase();
                if (knownAdditives.has(normalized) || knownAdditives.has('e' + eMatch[1])) {
                    matched.push({ name: cleanIng, count, source: 'e_number' });
                    continue;
                }
            }
            unmatched.push({ name: cleanIng, count });
        }
    }

    unmatched.sort((a, b) => b.count - a.count);
    hardcodedOnly.sort((a, b) => b.count - a.count);
    matched.sort((a, b) => b.count - a.count);

    console.log(`\n═══ MATCHING RESULTS ═══`);
    console.log(`✅ Matched in food_additives: ${matched.length}`);
    console.log(`⚠️  In HEBREW_INGREDIENT_NAMES only (no score!): ${hardcodedOnly.length}`);
    console.log(`❌ Completely unmatched ("לא במאגר"): ${unmatched.length}`);

    console.log(`\n── TOP 50 UNMATCHED (by frequency) ──`);
    for (const item of unmatched.slice(0, 50)) {
        console.log(`  [${item.count}x] ${item.name}`);
    }

    console.log(`\n── HARDCODED-ONLY (have Hebrew name but NO score) ──`);
    for (const item of hardcodedOnly.slice(0, 30)) {
        console.log(`  [${item.count}x] ${item.name}`);
    }

    const categories = {
        basic_foods: [],
        oils_fats: [],
        sugars_sweeteners: [],
        acids_chemicals: [],
        spices_herbs: [],
        dairy: [],
        grains_flours: [],
        nuts_seeds: [],
        misc: [],
    };

    for (const item of unmatched) {
        const n = item.name;
        if (/oil|fat|margarine|shortening/i.test(n)) categories.oils_fats.push(item);
        else if (/sugar|syrup|sweetener|honey|fructose|glucose|dextrose|maltose|sucrose|sorbitol|mannitol|xylitol|stevia|aspartame/i.test(n)) categories.sugars_sweeteners.push(item);
        else if (/acid|hydroxide|carbonate|phosphate|sulfate|chloride|nitrate|nitrite/i.test(n)) categories.acids_chemicals.push(item);
        else if (/spice|herb|cumin|coriander|oregano|basil|thyme|rosemary|parsley|dill|mint|sage|bay leaf|cardamom|nutmeg|clove|mustard|chili|cayenne/i.test(n)) categories.spices_herbs.push(item);
        else if (/milk|cream|cheese|yogurt|whey|casein|butter|lactose/i.test(n)) categories.dairy.push(item);
        else if (/flour|wheat|corn|rice|oat|barley|rye|semolina|bran|starch/i.test(n)) categories.grains_flours.push(item);
        else if (/nut|almond|walnut|hazelnut|cashew|pistachio|pecan|seed|sesame|sunflower|pumpkin/i.test(n)) categories.nuts_seeds.push(item);
        else if (/salt|water|egg|chicken|beef|pork|fish|fruit|vegetable|potato|tomato|onion|garlic|carrot|celery|lemon|apple|banana/i.test(n)) categories.basic_foods.push(item);
        else categories.misc.push(item);
    }

    console.log(`\n── UNMATCHED BY CATEGORY ──`);
    for (const [cat, items] of Object.entries(categories)) {
        if (items.length === 0) continue;
        console.log(`\n  ${cat.toUpperCase()} (${items.length}):`);
        for (const item of items.slice(0, 10)) {
            console.log(`    [${item.count}x] ${item.name}`);
        }
        if (items.length > 10) console.log(`    ... and ${items.length - 10} more`);
    }

    const report = {
        timestamp: new Date().toISOString(),
        stats: {
            known_additives: knownAdditives.size,
            hardcoded_names: hardcodedNames.size,
            hazi_hinam_food_products: hazi.foodProducts,
            total_unique_ingredients: combined.size,
            matched: matched.length,
            hardcoded_only: hardcodedOnly.length,
            unmatched: unmatched.length,
        },
        unmatched_top100: unmatched.slice(0, 100),
        hardcoded_only: hardcodedOnly,
        categories: Object.fromEntries(
            Object.entries(categories).map(([k, v]) => [k, v.map(i => ({ name: i.name, count: i.count }))])
        ),
        all_unmatched: unmatched.map(i => ({ name: i.name, count: i.count })),
    };

    const reportPath = path.join('C:', 'BENDA_PROJECT', 'HEALTHYSCAN', 'data', 'ingredient-gap-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Full report saved: ${reportPath}`);
}

main();
