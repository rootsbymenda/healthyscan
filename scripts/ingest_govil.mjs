/**
 * Ingest data.gov.il datasets into benda-food D1
 * Run: node scripts/ingest_govil.mjs
 */

import fs from 'fs';

const ACCOUNT = 'a84205672ea899dde6bc13490945d274';
const DB_ID = 'c1b030b1-28be-4c0d-a250-0d942782c157';
const TOKEN = 'v3MHDs6RU-dEtq1iP5V8wC3spvwDiP5LYuje29yx';
const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/d1/database/${DB_ID}/query`;
const DATA_DIR = 'C:/BENDA_PROJECT/ROOTS_BY_BENDA/04_SAFETY_DATA/data_gov_il';

async function query(sql, params = []) {
    const body = params.length > 0 ? { sql, params } : { sql };
    const res = await fetch(API, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.success) {
        throw new Error(`D1 error: ${JSON.stringify(data.errors)}`);
    }
    return data.result[0];
}

function esc(val) {
    if (val === null || val === undefined) return null;
    return String(val).trim() || null;
}

async function batchInsert(table, columns, rows, batchSize = 10) {
    const ph = '(' + columns.map(() => '?').join(',') + ')';
    let inserted = 0;
    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const multiPh = batch.map(() => ph).join(',');
        const params = batch.flat();
        try {
            await query(`INSERT OR IGNORE INTO ${table} (${columns.join(',')}) VALUES ${multiPh}`, params);
            inserted += batch.length;
        } catch (e) {
            // If batch fails, try one by one
            for (const row of batch) {
                try {
                    await query(`INSERT OR IGNORE INTO ${table} (${columns.join(',')}) VALUES ${ph}`, row);
                    inserted++;
                } catch (e2) { /* skip bad row */ }
            }
        }
        if ((i + batchSize) % 500 === 0 || i + batchSize >= rows.length) {
            console.log(`  ${table}: ${Math.min(i + batchSize, rows.length)}/${rows.length}`);
        }
    }
    return inserted;
}

function loadJSON(filename) {
    const raw = fs.readFileSync(`${DATA_DIR}/${filename}`, 'utf8');
    return JSON.parse(raw);
}

// ============================================================
// 1. RABBINATE IMPORTED FOODS (34,919 records)
// ============================================================
async function ingestRabbinate() {
    console.log('\n=== RABBINATE IMPORTED FOODS ===');
    await query(`CREATE TABLE IF NOT EXISTS il_rabbinate_foods (
        id INTEGER PRIMARY KEY,
        product_name_he TEXT,
        product_name_en TEXT,
        importer TEXT,
        country TEXT,
        manufacturer TEXT,
        kosher_cert TEXT,
        cert_number TEXT,
        cert_expiry TEXT,
        cert_start TEXT,
        category TEXT,
        description TEXT
    )`);

    const data = loadJSON('rabbinate_imported_foods.json');
    console.log(`  Loaded ${data.length} records`);

    const columns = ['id','product_name_he','product_name_en','importer','country','manufacturer','kosher_cert','cert_number','cert_expiry','cert_start','category','description'];
    const rows = data.map(r => [
        r._id,
        esc(r.name4),          // Hebrew product name
        esc(r.name5),          // English product name
        esc(r.name1),          // Importer
        esc(r.name2),          // Country
        esc(r.name6),          // Manufacturer
        esc(r.name3),          // Kosher certification
        esc(r.name7),          // Cert number
        esc(r.name8),          // Cert expiry
        esc(r.name9),          // Cert start
        esc(r.name10),         // Category (e.g., "פרווה | לימות השנה")
        esc(r.description),    // Label description
    ]);

    const count = await batchInsert('il_rabbinate_foods', columns, rows, 8);
    console.log(`  DONE: ${count} inserted`);
}

// ============================================================
// 2. MOH NUTRITION DATABASE (4,624 records)
// ============================================================
async function ingestNutrition() {
    console.log('\n=== MOH NUTRITION DATABASE ===');
    await query(`CREATE TABLE IF NOT EXISTS il_nutrition (
        id INTEGER PRIMARY KEY,
        code TEXT,
        food_name_he TEXT,
        food_name_en TEXT,
        source TEXT,
        energy_kcal REAL,
        protein REAL,
        total_fat REAL,
        carbohydrates REAL,
        total_sugars REAL,
        dietary_fiber REAL,
        sodium REAL,
        calcium REAL,
        iron REAL,
        potassium REAL,
        cholesterol REAL,
        saturated_fat REAL,
        trans_fat REAL,
        vitamin_a REAL,
        vitamin_c REAL,
        vitamin_d REAL,
        vitamin_b12 REAL,
        folate REAL,
        zinc REAL,
        magnesium REAL,
        phosphorus REAL
    )`);

    const data = loadJSON('moh_nutrition_database.json');
    console.log(`  Loaded ${data.length} records`);

    const columns = ['id','code','food_name_he','food_name_en','source','energy_kcal','protein','total_fat','carbohydrates','total_sugars','dietary_fiber','sodium','calcium','iron','potassium','cholesterol','saturated_fat','trans_fat','vitamin_a','vitamin_c','vitamin_d','vitamin_b12','folate','zinc','magnesium','phosphorus'];
    const rows = data.map(r => [
        r._id,
        esc(r.Code),
        esc(r.shmmitzrach),
        esc(r.english_name),
        esc(r.makor),
        r.food_energy || null,
        r.protein || null,
        r.total_fat || null,
        r.carbohydrates || null,
        r.total_sugars || null,
        r.total_dietary_fiber || null,
        r.sodium || null,
        r.calcium || null,
        r.iron || null,
        r.potassium || null,
        r.cholesterol || null,
        r.saturated_fat || null,
        r.trans_fatty_acids || null,
        r.vitamin_a_iu || null,
        r.vitamin_c || null,
        r.vitamin_d || null,
        r.vitamin_b12 || null,
        r.folate || null,
        r.zinc || null,
        r.magnesium || null,
        r.phosphorus || null,
    ]);

    const count = await batchInsert('il_nutrition', columns, rows, 8);
    console.log(`  DONE: ${count} inserted`);
}

// ============================================================
// 3. PESTICIDE MRL (3,708 records)
// ============================================================
async function ingestMRL() {
    console.log('\n=== PESTICIDE MRL ===');
    await query(`CREATE TABLE IF NOT EXISTS il_pesticide_mrl (
        id INTEGER PRIMARY KEY,
        active_substance TEXT,
        crop_he TEXT,
        crop_en TEXT,
        mrl REAL,
        updated_date TEXT,
        pending_mrl TEXT
    )`);

    const data = loadJSON('moh_pesticide_residues_mrl.json');
    console.log(`  Loaded ${data.length} records`);

    const columns = ['id','active_substance','crop_he','crop_en','mrl','updated_date','pending_mrl'];
    const rows = data.map(r => [
        r._id,
        esc(r['חומר_פעיל']),
        esc(r['גידול']),
        esc(r['גידול_אנגלי']),
        r.MRL || null,
        esc(r['תאריך_עדכון']),
        esc(r['MRL_בהמתנה']),
    ]);

    const count = await batchInsert('il_pesticide_mrl', columns, rows, 10);
    console.log(`  DONE: ${count} inserted`);
}

// ============================================================
// 4. FOOD MANUFACTURERS (4,755 records)
// ============================================================
async function ingestManufacturers() {
    console.log('\n=== FOOD MANUFACTURERS ===');
    await query(`CREATE TABLE IF NOT EXISTS il_food_manufacturers (
        id INTEGER PRIMARY KEY,
        license TEXT,
        name TEXT,
        expire_date TEXT,
        gmp_expire_date TEXT,
        product_types TEXT,
        account_type TEXT,
        gmp_status TEXT,
        health_district TEXT,
        city TEXT,
        address TEXT
    )`);

    const data = loadJSON('moh_food_manufacturers.json');
    console.log(`  Loaded ${data.length} records`);

    const columns = ['id','license','name','expire_date','gmp_expire_date','product_types','account_type','gmp_status','health_district','city','address'];
    const rows = data.map(r => [
        r._id,
        esc(r.license),
        esc(r.title),
        esc(r.expire_date),
        esc(r.gmp_expire_date),
        esc(r.ProductActivityFoodType),
        esc(r.accountType),
        esc(r.gmpstatuscode),
        esc(r.health_district_desc),
        esc(r.city),
        esc(r.Addr),
    ]);

    const count = await batchInsert('il_food_manufacturers', columns, rows, 10);
    console.log(`  DONE: ${count} inserted`);
}

// ============================================================
// 5. FOOD IMPORTERS (2,960 records)
// ============================================================
async function ingestImporters() {
    console.log('\n=== FOOD IMPORTERS ===');
    await query(`CREATE TABLE IF NOT EXISTS il_food_importers (
        id INTEGER PRIMARY KEY,
        reg_number TEXT,
        name TEXT,
        address TEXT,
        importer_type TEXT,
        type_name TEXT,
        naut TEXT,
        naut_description TEXT,
        trust_level TEXT,
        trust_description TEXT
    )`);

    const data = loadJSON('moh_food_importers.json');
    console.log(`  Loaded ${data.length} records`);

    const columns = ['id','reg_number','name','address','importer_type','type_name','naut','naut_description','trust_level','trust_description'];
    const rows = data.map(r => [
        r._id,
        esc(r.Regnum),
        esc(r.importer_name),
        esc(r.Address),
        esc(r.importer_type),
        esc(r.importer_type_name),
        esc(r.naut),
        esc(r.naut_description),
        esc(r.trust),
        esc(r.Trust_description),
    ]);

    const count = await batchInsert('il_food_importers', columns, rows, 10);
    console.log(`  DONE: ${count} inserted`);
}

// ============================================================
// 6. PESTICIDE DATABASE (49,624 records)
// ============================================================
async function ingestPesticides() {
    console.log('\n=== PESTICIDE DATABASE (English) ===');
    await query(`CREATE TABLE IF NOT EXISTS il_pesticides (
        id INTEGER PRIMARY KEY,
        registration_number TEXT,
        pesticide_type TEXT,
        product_name_he TEXT,
        product_name_en TEXT,
        active_ingredient TEXT,
        cas_number TEXT,
        mode_of_action TEXT,
        concentration TEXT,
        formulation_type TEXT,
        manufacturer_he TEXT,
        manufacturer_en TEXT,
        toxicity_class_he TEXT,
        toxicity_class_en TEXT,
        crop_group_en TEXT,
        crop_en TEXT,
        crop_he TEXT,
        pest_en TEXT,
        pest_he TEXT,
        dosage TEXT,
        waiting_days TEXT,
        label_url TEXT
    )`);

    const data = loadJSON('pesticide_db_english.json');
    console.log(`  Loaded ${data.length} records`);

    const columns = ['id','registration_number','pesticide_type','product_name_he','product_name_en','active_ingredient','cas_number','mode_of_action','concentration','formulation_type','manufacturer_he','manufacturer_en','toxicity_class_he','toxicity_class_en','crop_group_en','crop_en','crop_he','pest_en','pest_he','dosage','waiting_days','label_url'];
    const rows = data.map(r => [
        r._id,
        esc(r.Registraion_Number),
        esc(r.Pesticide_Type),
        esc(r.Product_name_Hebrew),
        esc(r.Product_name_English),
        esc(r.Active_Ingredient),
        esc(r.Cas_Number),
        esc(r.Mode_of_action),
        esc(r.Concentration_English || r.Concentration_of_active_ingred),
        esc(r.Formulation_type_English),
        esc(r.Manufacturer_Name_Hebrew),
        esc(r.Manufacturer_Name_English),
        esc(r.Toxicity_Class_Hebrew),
        esc(r.Toxicity_Class_English),
        esc(r.Crop_Group_English),
        esc(r.Crop_English),
        esc(r.Crop_Hebrew),
        esc(r.Pest_English),
        esc(r.Pest_Hebrew),
        esc(r.Dosage_per_application),
        esc(r.Waiting_Days),
        esc(r.Label),
    ]);

    const count = await batchInsert('il_pesticides', columns, rows, 6);
    console.log(`  DONE: ${count} inserted`);
}

// ============================================================
// 7. MOH RECIPES (8,324 records)
// ============================================================
async function ingestRecipes() {
    console.log('\n=== MOH RECIPES ===');
    await query(`CREATE TABLE IF NOT EXISTS il_recipes (
        id INTEGER PRIMARY KEY,
        recipe_code TEXT,
        base_ingredient TEXT,
        weight REAL,
        retention REAL,
        percentage REAL,
        measure TEXT,
        quantity REAL,
        is_visible INTEGER
    )`);

    const data = loadJSON('moh_recipes.json');
    console.log(`  Loaded ${data.length} records`);

    const columns = ['id','recipe_code','base_ingredient','weight','retention','percentage','measure','quantity','is_visible'];
    const rows = data.map(r => [
        r._id,
        esc(r.mmitzrach),
        esc(r.mitzbsisi),
        r.mishkal || null,
        r.retention || null,
        r.ahuz || null,
        esc(r.mida),
        r.kamut || null,
        r.is_visible || 0,
    ]);

    const count = await batchInsert('il_recipes', columns, rows, 10);
    console.log(`  DONE: ${count} inserted`);
}

// ============================================================
// 8. SMALLER DATASETS
// ============================================================
async function ingestSmallDatasets() {
    // Official standards (565)
    console.log('\n=== OFFICIAL STANDARDS ===');
    await query(`CREATE TABLE IF NOT EXISTS il_standards (
        id INTEGER PRIMARY KEY,
        standard_number TEXT,
        standard_name TEXT,
        standard_name_en TEXT,
        edition TEXT,
        validity_from TEXT,
        validity_to TEXT,
        is_mandatory INTEGER,
        note TEXT
    )`);
    const standards = loadJSON('official_standards.json');
    console.log(`  Loaded ${standards.length} records`);
    const stdCols = ['id','standard_number','standard_name','standard_name_en','edition','validity_from','validity_to','is_mandatory','note'];
    const stdRows = standards.map(r => [
        r._id, esc(r.standard_number), esc(r.standard_name), esc(r.standard_name_en),
        esc(r.standard_edition), esc(r.validity_from), esc(r.validity_to),
        r.is_standard_mandatory === 'TRUE' || r.is_standard_mandatory === true ? 1 : 0,
        esc(r.note),
    ]);
    const stdCount = await batchInsert('il_standards', stdCols, stdRows, 10);
    console.log(`  DONE: ${stdCount} inserted`);

    // Licensed pesticides (167)
    console.log('\n=== LICENSED PESTICIDES ===');
    await query(`CREATE TABLE IF NOT EXISTS il_licensed_pesticides (
        id INTEGER PRIMARY KEY,
        name TEXT,
        holder TEXT,
        registration_number TEXT,
        description TEXT,
        expiry_date TEXT,
        active_ingredients TEXT,
        purpose TEXT,
        authorized_users TEXT
    )`);
    const licensed = loadJSON('licensed_pesticides.json');
    console.log(`  Loaded ${licensed.length} records`);
    const licCols = ['id','name','holder','registration_number','description','expiry_date','active_ingredients','purpose','authorized_users'];
    const licRows = licensed.map(r => [
        r._id, esc(r['שם התכשיר']), esc(r['שם בעל תעודת הרישום']), esc(r['מספר רשום']),
        esc(r['תוארית']), esc(r['תאריך תפוגה']), esc(r['חומרים פעילים']),
        esc(r['יעוד התכשיר']), esc(r['רשאים להשתמש בתכשיר']),
    ]);
    const licCount = await batchInsert('il_licensed_pesticides', licCols, licRows, 10);
    console.log(`  DONE: ${licCount} inserted`);

    // EU regulations (69)
    console.log('\n=== EU REGULATIONS ===');
    await query(`CREATE TABLE IF NOT EXISTS il_eu_regulations (
        id INTEGER PRIMARY KEY,
        directive_en TEXT,
        directive_he TEXT,
        directive_date TEXT,
        start_date TEXT,
        comments TEXT,
        end_date TEXT,
        synonyms TEXT,
        terms TEXT
    )`);
    const euRegs = loadJSON('eu_regulations_list.json');
    console.log(`  Loaded ${euRegs.length} records`);
    const euCols = ['id','directive_en','directive_he','directive_date','start_date','comments','end_date','synonyms','terms'];
    const euRows = euRegs.map(r => [
        r._id, esc(r.directive_en_name), esc(r.directive_hebrew_name), esc(r.directive_date),
        esc(r.start_date_txt), esc(r.comments), esc(r.end_date), esc(r.synonyms), esc(r.terms),
    ]);
    const euCount = await batchInsert('il_eu_regulations', euCols, euRows, 10);
    console.log(`  DONE: ${euCount} inserted`);
}

// ============================================================
// RUN ALL
// ============================================================
async function main() {
    console.log('=== GOV.IL DATA INGESTION INTO BENDA-FOOD D1 ===');
    console.log('Started:', new Date().toISOString());

    try {
        await ingestRabbinate();      // 34,919
        await ingestNutrition();      // 4,624
        await ingestMRL();            // 3,708
        await ingestManufacturers();  // 4,755
        await ingestImporters();      // 2,960
        await ingestRecipes();        // 8,324
        await ingestPesticides();     // 49,624 (biggest, last)
        await ingestSmallDatasets();  // 801
    } catch (e) {
        console.error('FATAL:', e.message);
    }

    // Final count
    try {
        const res = await query("SELECT name, (SELECT COUNT(*) FROM il_rabbinate_foods) as rabbinate, (SELECT COUNT(*) FROM il_nutrition) as nutrition, (SELECT COUNT(*) FROM il_pesticide_mrl) as mrl, (SELECT COUNT(*) FROM il_food_manufacturers) as manufacturers, (SELECT COUNT(*) FROM il_food_importers) as importers, (SELECT COUNT(*) FROM il_pesticides) as pesticides, (SELECT COUNT(*) FROM il_recipes) as recipes FROM sqlite_master LIMIT 1");
        console.log('\n=== FINAL COUNTS ===');
        console.log(JSON.stringify(res.results[0], null, 2));
    } catch(e) {
        console.log('Count query error:', e.message);
    }

    console.log('\nFinished:', new Date().toISOString());
}

main();
