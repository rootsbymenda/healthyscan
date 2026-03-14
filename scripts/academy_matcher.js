// Academy Hebrew Name Matcher
// Reads the academy SQL file and matches against food_additives missing Hebrew names
// Generates SQL UPDATE statements

const fs = require('fs');
const path = require('path');

// Read missing names
const missingNames = JSON.parse(fs.readFileSync('C:/BENDA_PROJECT/missing_names.json', 'utf8'));
console.log('Missing names count:', missingNames.length);

// Create a lookup map: lowercase english -> original common_name
const missingLookup = new Map();
for (const name of missingNames) {
  missingLookup.set(name.toLowerCase(), name);
}

// Priority dictionaries (food/chemistry related keywords in Hebrew and English)
const priorityKeywords = [
  'כימיה', 'ביולוגיה', 'הנדסה כימית', 'כימיה אורגנית', 'מיקרוביולוגיה',
  'אפייה', 'כלכלת בית', 'מדעי המזון', 'תזונה', 'ביוכימיה', 'רוקחות',
  'רפואה', 'פרמקולוגיה', 'חקלאות', 'צמחים', 'בוטניקה', 'זואולוגיה',
  'food', 'chem', 'bio', 'bak', 'home', 'nutri', 'pharm', 'agri', 'botan',
  'מזון', 'תעשיית', 'חומרים', 'סביבה', 'גיאולוגיה', 'מינרלוגיה'
];

// Exclusions: matches that are clearly wrong (word has different meaning in context)
const exclusions = new Map([
  // Fish/animal names that matched non-food meanings
  ['bass', 'music term, not fish'],
  ['crab', 'geodesy term, not the animal'],
  ['flounder', 'maritime cables, not the fish'],
  ['pike', 'gymnastics term, not the fish'],
  ['drum', 'vessel, not the fish'],
  ['perch', 'agriculture rack, not the fish'],
  // Food terms with wrong translations
  ['fu', 'smoke generator, not tofu skin'],
  ['char', 'carbonization, not the fish/tea'],
  // Wrong contexts
  ['cellulose acetate', 'textile silk acetate, not food additive cellulose acetate'],
  ['sesame oil', 'tahini, not sesame oil - different product'],
  ['tomato juice', 'tomato porridge, not juice'],
]);

// Manual corrections for terms where academy has a match but from wrong dictionary
// These are cases where the Hebrew translation IS correct but came from a non-food dict
const manualCorrections = new Map([
  // Kiwi from animal dict is still correct Hebrew for the fruit
  // Quark from physics - NOT correct for the cheese (quark cheese = קוורק in Hebrew too, but context is dairy)
  ['quark', null],  // remove - physics particle, not dairy quark
  ['salmon', null],  // salmon from philately - remove, let it keep סלמון but from better source
]);

function isDictPriority(dict) {
  const d = dict.toLowerCase();
  return priorityKeywords.some(p => d.includes(p));
}

// Parse the SQL file
const academyPath = 'C:/BENDA_PROJECT/ROOTS_BY_BENDA/sql_academy/academy_full_126997.sql';
console.log('Reading academy SQL file...');
const content = fs.readFileSync(academyPath, 'utf8');
const lines = content.split('\n');
console.log('Total lines in file:', lines.length);

// Regex for INSERT lines
const insertRegex = /INSERT INTO academy_terms.*VALUES\s*\('([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\)/i;

// Collect matches
const academyMap = new Map();
let insertCount = 0;
let parsedCount = 0;

for (const line of lines) {
  if (!line.startsWith('INSERT')) continue;
  insertCount++;

  const m = line.match(insertRegex);
  if (!m) continue;
  parsedCount++;

  const hebrewNiqqud = m[1];
  const hebrew = m[2];
  const english = m[3];
  const dictionary = m[4];
  const genre = m[5];

  if (!english || !hebrew) continue;

  const englishLower = english.toLowerCase().trim();

  // Check exact match
  if (missingLookup.has(englishLower)) {
    // Skip excluded terms
    if (exclusions.has(englishLower)) continue;
    // Skip manual removals
    if (manualCorrections.has(englishLower) && manualCorrections.get(englishLower) === null) continue;

    const existing = academyMap.get(englishLower);
    const isPriority = isDictPriority(dictionary);

    // Prefer priority dictionaries, or first match if same priority level
    if (!existing || (!existing.isPriority && isPriority)) {
      academyMap.set(englishLower, {
        hebrew,
        hebrewNiqqud,
        dictionary,
        genre,
        isPriority,
        english
      });
    }
  }
}

console.log('Total INSERT lines:', insertCount);
console.log('Successfully parsed:', parsedCount);
console.log('Exact matches found:', academyMap.size);

// Generate SQL UPDATE statements
const updates = [];
for (const [englishLower, data] of academyMap) {
  const commonName = missingLookup.get(englishLower);
  // Escape single quotes in values
  const hebrewEscaped = data.hebrew.replace(/'/g, "''");
  const commonNameEscaped = commonName.replace(/'/g, "''");
  updates.push({
    sql: "UPDATE food_additives SET hebrew_name = '" + hebrewEscaped + "' WHERE common_name = '" + commonNameEscaped + "';",
    commonName,
    hebrew: data.hebrew,
    dictionary: data.dictionary,
    isPriority: data.isPriority
  });
}

// Sort: priority dict matches first, then alphabetical
updates.sort((a, b) => {
  if (a.isPriority && !b.isPriority) return -1;
  if (!a.isPriority && b.isPriority) return 1;
  return a.commonName.localeCompare(b.commonName);
});

const priorityUpdates = updates.filter(u => u.isPriority);
const otherUpdates = updates.filter(u => !u.isPriority);

console.log('\nMatches by source:');
console.log('  Priority dict matches:', priorityUpdates.length);
console.log('  Other dict matches:', otherUpdates.length);
console.log('  Total:', updates.length);

// Build SQL file content
let sqlContent = '-- Hebrew Academy translations for food_additives\n';
sqlContent += '-- Source: Hebrew Academy of Language terminology database (126,997 terms)\n';
sqlContent += '-- Generated: ' + new Date().toISOString().split('T')[0] + '\n';
sqlContent += '-- Matches found: ' + updates.length + ' out of ' + missingNames.length + ' missing hebrew_name entries\n';
sqlContent += '-- Priority dictionaries: Chemistry, Biology, Chemical Engineering, Organic Chemistry,\n';
sqlContent += '--   Microbiology, Baking, Home Economics, Food Science, Nutrition, Biochemistry,\n';
sqlContent += '--   Pharmacology, Agriculture, Botany\n';
sqlContent += '--\n';
sqlContent += '-- Each UPDATE is tagged with source dictionary for traceability\n\n';

if (priorityUpdates.length > 0) {
  sqlContent += '-- ============================================\n';
  sqlContent += '-- PRIORITY MATCHES (Food/Chemistry dictionaries)\n';
  sqlContent += '-- ============================================\n\n';
  for (const u of priorityUpdates) {
    sqlContent += '-- Source: ' + u.dictionary + '\n';
    sqlContent += '-- ' + u.commonName + ' -> ' + u.hebrew + '\n';
    sqlContent += u.sql + '\n\n';
  }
}

if (otherUpdates.length > 0) {
  sqlContent += '-- ============================================\n';
  sqlContent += '-- OTHER DICTIONARY MATCHES\n';
  sqlContent += '-- ============================================\n\n';
  for (const u of otherUpdates) {
    sqlContent += '-- Source: ' + u.dictionary + '\n';
    sqlContent += '-- ' + u.commonName + ' -> ' + u.hebrew + '\n';
    sqlContent += u.sql + '\n\n';
  }
}

const outputPath = 'C:/BENDA_PROJECT/HEALTHYSCAN/scripts/sql/11-academy-hebrew-names.sql';
fs.writeFileSync(outputPath, sqlContent, 'utf8');
console.log('\nSQL file written to:', outputPath);
console.log('File size:', (fs.statSync(outputPath).size / 1024).toFixed(1) + ' KB');

// Print all matches
console.log('\n=== ALL MATCHES ===');
for (const u of updates) {
  const tag = u.isPriority ? '[PRIORITY]' : '[OTHER]';
  console.log('  ' + tag + ' ' + u.commonName + ' -> ' + u.hebrew + ' [' + u.dictionary.substring(0, 50) + ']');
}
