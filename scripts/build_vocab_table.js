/**
 * build_vocab_table.js
 *
 * Builds the hebrew_english_dict table — our OWNED translation asset.
 * Sources:
 *   1. Hebrew Academy 126,997 terms (filtered by relevant dictionaries)
 *   2. 814 compound translations from 12-academy-compound-translations.sql
 *   3. Word-level extractions from multi-word Academy terms
 *
 * Output: scripts/sql/13-hebrew-english-dict.sql
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION: Dictionary filtering rules
// ============================================================================

// Dictionary name substrings that INCLUDE a term (case-insensitive Hebrew matching)
const INCLUDE_DICT_PATTERNS = [
  // Chemistry
  'כימיה',
  'הנדסה כימית',
  // Biology
  'ביולוגיה',
  'מיקרוביולוגיה',
  'סרולוגיה',
  // Medicine & Health
  'רפואה',
  'פרמקולוגיה',
  'אנטומיה',
  'אפידמיולוגיה',
  'בריאות הציבור',
  'עישון',
  'רפואת',
  // Food & cooking
  'אפייה',
  'כלכלת הבית',
  'מטבח',
  'תבשילים',
  'יין',
  // Agriculture & Botany
  'חקלאות',
  'בוטניקה',
  'צמחי',
  'צמחים',
  'מחלות צמחים',
  'חלקי הפרח',
  'מורפולוגיית צמחים',
  'מיני הדלועים',
  'גידול דבורים',
  'גידול צאן',
  'פטריות',
  'קרקע',
  // Environmental
  'איכות הסביבה',
  'הדברה',
  'תברואה',
  'ביוב',
  // Zoology (food-relevant)
  'בעלי חיים',
  'דגי',
  'זוחלים',
  'רכיכות',
  // General science that might contain food/health terms
  'אנרגייה',
];

// Genre-based inclusion (broader net)
const INCLUDE_GENRES = [
  'מדעי החיים ורפואה',
  'מזון וכלכלת הבית',
  'מדעים מדויקים',    // includes chemistry, physics
  'מדעי כדור הארץ',   // environment, geology
];

// EXCLUDE these dictionary patterns even if genre matches
const EXCLUDE_DICT_PATTERNS = [
  'טכנולוגיית המידע',
  'אלקטרוניקה',
  'לוחמה',
  'צילום',
  'דפוס',
  'סרטוט',
  'ימאות',
  'ספנות',
  'כלי שיט',
  'תחבורה',
  'הנדסת דרכים',
  'בולאות',
  'מוסיקה',
  'כינור',
  'תיאטרון',
  'ספרות',
  'שירה',
  'התעמלות',
  'חינוך גופני',
  'תרבות הגוף',
  'דיפלומטיה',
  'משפט',
  'הדין',
  'מדע המדינה',
  'מנהל ציבורי',
  'חינוך',
  'גני ילדים',
  'דקדוק',
  'בלשנות',
  'פסיכולוגיה',
  'סוציולוגיה',
  'דמוגרפיה',
  'ארכאולוגיה',
  'ארכיונאות',
  'ספרנות',
  'בנקאות',
  'ביטוח',
  'כלכלה',
  'חשבונאות',
  'פנקסנות',
  'מס הכנסה',
  'שיווק',
  'עבודה',
  'משרד',
  'בניין',
  'בנאות',
  'נגרות',
  'רהיטים',
  'מסגרות',
  'ריצוף',
  'יציקה',
  'בטון',
  'סכרים',
  'מכונית',
  'מכונת',
  'הלבשה',
  'טקסטיל',
  'אריגה',
  'רקמה',
  'תפירה',
  'מלבושים',
  'סנדלרות',
  'הנעלה',
  'רצענות',
  'כביסה',
  'רתכות',
  'שיתוך',
  'צבעות',
  'צבעים',
  'קדרות',
  'כבאות',
  'חירום',
  'גאוגרפיה',
  'גאודזיה',
  'אסטרונומיה',
  'מטאורולוגיה',
  'גלי הים',
  'ניקוז',
  'הידרולוגיה',
  'הידרוליקה',
  'משאבות',
  'דודי קיטור',
  'קירור והסקה',
  'חוזק חומרים',
  'מדידה',
  'סטטיסטיקה',
  'מתמטיקה',
  'חשבון',
  'משפחה',
  'תקשורת',
  'רדיו',
  'טלפונאות',
  'חלקי המנורה',
  'ברכות',
  'תשמישי רחצה',
  'כלי הרמה',
  'כלי יד',
  'כלי עבודה',
  'סחר עצים',
  'מציאות מדומה',
  'למידה מתוקשבת',
  'מולטימדיה',
  'שפות תכנות',
  'גרפיקה',
  'אמינות, תחזוקתיות',
  'זיהוי קול',
  'ראיית מחשב',
  'רשתות',
  'מסדי נתונים',
  'פיתוח מערכות',
  'עיבוד נתונים',
  'עיבוד תמלילים',
  'בקרה',
  'חומרה',
  'ייצור כליל',
  'הכנת נתונים',
  'ארגון נתונים',
  'ייצוג נתונים',
  'מצעי נתונים',
  'דואר אלקטרוני',
  'נגישות',
  'סימני דפוס',
  'מונחים יחידים',
  'טכניקות',
  'טכניקה',
  'חברור',
  'למידת מכונה',
  'בינה מלאכותית',
  'מושגים בסיסיים',
  'רשתות עצביות',
  'תורת המידע',
  'תכנון מרחבי',
  'בניין ערים',
  'מקרואלקטרוניקה',
  'מיקרואלקטרוניקה',
  'טקסטילים בארכאולוגיה',
  'חשמל',
  'קשר',
];

// Category mapping from dictionary name patterns
const CATEGORY_MAP = [
  // Chemistry - most specific first
  { patterns: ['כימיה אורגנית'], category: 'chemistry' },
  { patterns: ['כימיה אי-אורגנית'], category: 'chemistry' },
  { patterns: ['כימיה כללית'], category: 'chemistry' },
  { patterns: ['הנדסה כימית'], category: 'chemistry' },
  { patterns: ['כימיה'], category: 'chemistry' },
  // Biology
  { patterns: ['מיקרוביולוגיה', 'סרולוגיה'], category: 'biology' },
  { patterns: ['ביולוגיה'], category: 'biology' },
  // Medicine
  { patterns: ['רפואה', 'רפואת', 'אנטומיה', 'פרמקולוגיה', 'אפידמיולוגיה', 'בריאות הציבור', 'עישון'], category: 'medicine' },
  // Food
  { patterns: ['אפייה', 'כלכלת הבית', 'מטבח', 'תבשילים', 'יין'], category: 'food' },
  // Botany & Agriculture
  { patterns: ['בוטניקה', 'צמחי', 'צמחים', 'חלקי הפרח', 'מורפולוגיית צמחים', 'מיני הדלועים', 'מחלות צמחים', 'פטריות'], category: 'botany' },
  { patterns: ['חקלאות', 'גידול דבורים', 'גידול צאן', 'קרקע', 'משק חקלאי'], category: 'agriculture' },
  // Environment
  { patterns: ['איכות הסביבה', 'הדברה', 'תברואה', 'ביוב', 'הבראת מעונות'], category: 'environment' },
  // Zoology
  { patterns: ['בעלי חיים', 'דגי', 'אלמוגים', 'זוחלים', 'רכיכות', 'יתושים', 'זבובאים', 'חיפושיות', 'עשים', 'פרפרים', 'עכבישנים', 'שפיראים', 'קווצי-עור', 'צורבים', 'גמלי שלמה', 'סדרות החרקים'], category: 'zoology' },
  // Physics (includes some chemistry-adjacent)
  { patterns: ['פיזיקה', 'אנרגייה'], category: 'physics' },
];

// ============================================================================
// STEP 1: Parse Academy SQL file
// ============================================================================

function parseAcademySQL(filePath) {
  console.log('Reading Academy SQL file...');
  const data = fs.readFileSync(filePath, 'utf8');
  const lines = data.split('\n');

  const entries = [];
  const regex = /VALUES \('([^']*)', '([^']*)', '([^']*)', '([^']*)', '([^']*)'\)/;

  let parsed = 0;
  let skippedNoEnglish = 0;

  for (const line of lines) {
    if (!line.startsWith('INSERT')) continue;
    const m = line.match(regex);
    if (!m) continue;

    const [, hebrewNiqqud, hebrew, english, dictionary, genre] = m;

    // Skip entries with no English
    if (!english || english.trim() === '') {
      skippedNoEnglish++;
      continue;
    }

    parsed++;
    entries.push({ hebrewNiqqud, hebrew, english: english.trim(), dictionary, genre });
  }

  console.log(`  Parsed ${parsed} entries with English (skipped ${skippedNoEnglish} without English)`);
  return entries;
}

// ============================================================================
// STEP 2: Filter by relevant dictionaries
// ============================================================================

function shouldInclude(entry) {
  const dict = entry.dictionary;
  const genre = entry.genre;

  // First check exclusions — these override everything
  for (const pattern of EXCLUDE_DICT_PATTERNS) {
    if (dict.includes(pattern)) return false;
  }

  // Check dictionary name patterns
  for (const pattern of INCLUDE_DICT_PATTERNS) {
    if (dict.includes(pattern)) return true;
  }

  // Check genre
  for (const g of INCLUDE_GENRES) {
    if (genre === g) return true;
  }

  // "שימוש כללי" (general use) — include these as they often have cross-domain terms
  // but with medium confidence
  if (dict.includes('שימוש כללי')) return true;

  return false;
}

function getCategory(dictionary) {
  for (const mapping of CATEGORY_MAP) {
    for (const pattern of mapping.patterns) {
      if (dictionary.includes(pattern)) {
        return mapping.category;
      }
    }
  }
  // General use terms
  if (dictionary.includes('שימוש כללי')) return 'general';
  return 'other';
}

function getConfidence(entry, category) {
  const highConfCategories = ['chemistry', 'food', 'biology', 'medicine', 'botany', 'agriculture'];
  const medConfCategories = ['environment', 'zoology', 'physics'];

  if (highConfCategories.includes(category)) return 'high';
  if (medConfCategories.includes(category)) return 'medium';
  if (category === 'general') return 'medium';
  return 'low';
}

function filterEntries(entries) {
  console.log('Filtering entries by relevant dictionaries...');

  const filtered = [];
  const dictStats = {};
  const categoryStats = {};

  for (const entry of entries) {
    if (!shouldInclude(entry)) continue;

    const category = getCategory(entry.dictionary);
    const confidence = getConfidence(entry, category);

    // Track stats
    dictStats[entry.dictionary] = (dictStats[entry.dictionary] || 0) + 1;
    categoryStats[category] = (categoryStats[category] || 0) + 1;

    filtered.push({
      english: entry.english,
      hebrew: entry.hebrew,
      hebrewNiqqud: entry.hebrewNiqqud,
      category,
      source: 'academy',
      sourceDict: entry.dictionary,
      confidence,
    });
  }

  console.log(`  Filtered to ${filtered.length} relevant entries`);
  console.log('  Category breakdown:');
  Object.entries(categoryStats).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`    ${cat}: ${count}`);
  });
  console.log(`  From ${Object.keys(dictStats).length} unique dictionaries`);

  return filtered;
}

// ============================================================================
// STEP 3: Parse compound translations
// ============================================================================

function parseCompoundTranslations(filePath) {
  console.log('Reading compound translations...');
  const data = fs.readFileSync(filePath, 'utf8');
  const lines = data.split('\n');

  const entries = [];
  const seen = new Set();

  // Pattern: -- English Name -> Hebrew Name (description)
  // followed by UPDATE ... common_name = 'English Name' ...
  // and UPDATE ... hebrew_name = 'Hebrew Name' ...

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Match comment lines with ->
    if (line.startsWith('--') && line.includes('->')) {
      const match = line.match(/^--\s+(.+?)\s+->\s+(.+?)\s+\(/);
      if (match) {
        let english = match[1].trim();
        let hebrew = match[2].trim();

        // Clean up english — remove parenthetical notes
        // But keep the raw english for the mapping
        const key = `${english.toLowerCase()}|||${hebrew}`;
        if (seen.has(key)) continue;
        seen.add(key);

        entries.push({
          english,
          hebrew,
          hebrewNiqqud: null,
          category: 'chemistry', // Most compound translations are chemistry
          source: 'composed',
          sourceDict: 'compound-translations',
          confidence: 'high',
        });
      }
    }
  }

  console.log(`  Parsed ${entries.length} compound translations`);
  return entries;
}

// ============================================================================
// STEP 4: Extract word-level entries from multi-word terms
// ============================================================================

function extractWordLevel(academyFiltered) {
  console.log('Extracting word-level entries from multi-word terms...');

  // Build word-pair map: for each english word, what hebrew word(s) appear with it?
  // We'll look at terms where both english and hebrew have the same number of words.
  // Also track categories so word-level entries inherit the right category.

  const wordPairs = new Map(); // english_word -> { hebrew_word -> { count, highConf, categories } }

  // Specifically look at 2-word pairs first (most reliable)
  for (const entry of academyFiltered) {
    const engWords = entry.english.split(/\s+/).filter(w => w.length > 1);
    const hebWords = entry.hebrew.split(/\s+/).filter(w => w.length > 1);

    // Only process pairs where word counts match
    if (engWords.length !== hebWords.length) continue;
    if (engWords.length < 2) continue;

    // For 2-word terms, the mapping is typically reversed (Hebrew is right-to-left)
    // English: "word1 word2" -> Hebrew: "word2_heb word1_heb" (reversed)
    // But in chemistry it's often: "Calcium Carbonate" -> "קרבונט סידן"
    // where Calcium=סידן, Carbonate=קרבונט

    if (engWords.length === 2) {
      // In Hebrew chemistry nomenclature, order is typically reversed
      // English: Adjective/Element Noun -> Hebrew: Noun Element/Adjective
      const eng1 = engWords[0].toLowerCase();
      const eng2 = engWords[1].toLowerCase();
      const heb1 = hebWords[0];
      const heb2 = hebWords[1];

      // Reversed mapping (most common in chemistry)
      addWordPair(wordPairs, eng1, heb2, entry.confidence, entry.category);
      addWordPair(wordPairs, eng2, heb1, entry.confidence, entry.category);
    }
  }

  // Now extract reliable single-word mappings
  // A word mapping is "reliable" if it appears 2+ times consistently
  const wordEntries = [];
  const seen = new Set();

  for (const [engWord, hebMap] of wordPairs) {
    // Skip very short words
    if (engWord.length < 3) continue;

    // Skip common non-content words
    if (['the', 'and', 'acid', 'for', 'with', 'not'].includes(engWord)) continue;

    // Find the most common Hebrew translation
    let bestHeb = null;
    let bestCount = 0;
    let totalCount = 0;
    let bestCategories = {};

    for (const [heb, data] of hebMap) {
      totalCount += data.count;
      if (data.count > bestCount) {
        bestCount = data.count;
        bestHeb = heb;
        bestCategories = data.categories;
      }
    }

    // Need at least 2 occurrences for reliability
    if (bestCount < 2) continue;

    // Confidence based on consistency
    const consistency = bestCount / totalCount;
    let confidence = 'low';
    if (consistency >= 0.8 && bestCount >= 3) confidence = 'high';
    else if (consistency >= 0.6 && bestCount >= 2) confidence = 'medium';

    // Determine category from most common source category
    let bestCat = 'chemistry';
    let bestCatCount = 0;
    for (const [cat, cnt] of Object.entries(bestCategories)) {
      if (cnt > bestCatCount) {
        bestCatCount = cnt;
        bestCat = cat;
      }
    }

    // Capitalize the English word
    const englishCap = engWord.charAt(0).toUpperCase() + engWord.slice(1);

    const key = `${englishCap.toLowerCase()}|||${bestHeb}`;
    if (seen.has(key)) continue;
    seen.add(key);

    wordEntries.push({
      english: englishCap,
      hebrew: bestHeb,
      hebrewNiqqud: null,
      category: bestCat,
      source: 'word-level',
      sourceDict: `extracted (${bestCount}/${totalCount} occurrences)`,
      confidence,
    });
  }

  console.log(`  Extracted ${wordEntries.length} reliable word-level entries`);
  return wordEntries;
}

function addWordPair(wordPairs, engWord, hebWord, confidence, category) {
  engWord = engWord.toLowerCase();
  if (!wordPairs.has(engWord)) {
    wordPairs.set(engWord, new Map());
  }
  const hebMap = wordPairs.get(engWord);
  if (!hebMap.has(hebWord)) {
    hebMap.set(hebWord, { count: 0, highConf: 0, categories: {} });
  }
  const data = hebMap.get(hebWord);
  data.count++;
  if (confidence === 'high') data.highConf++;
  if (category) {
    data.categories[category] = (data.categories[category] || 0) + 1;
  }
}

// ============================================================================
// STEP 5: Deduplicate
// ============================================================================

function deduplicate(allEntries) {
  console.log('Deduplicating entries...');

  const seen = new Map(); // key -> entry (keeping highest confidence)
  const confRank = { high: 3, medium: 2, low: 1 };
  // Source priority: academy > composed > word-level
  const sourceRank = { academy: 3, composed: 2, 'word-level': 1 };

  for (const entry of allEntries) {
    const key = `${entry.english.toLowerCase()}|||${entry.hebrew}`;

    if (seen.has(key)) {
      const existing = seen.get(key);
      // Keep the higher-confidence/higher-source entry
      const existingScore = (confRank[existing.confidence] || 0) * 10 + (sourceRank[existing.source] || 0);
      const newScore = (confRank[entry.confidence] || 0) * 10 + (sourceRank[entry.source] || 0);

      if (newScore > existingScore) {
        seen.set(key, entry);
      } else if (newScore === existingScore) {
        // If same score, prefer the one with niqqud
        if (entry.hebrewNiqqud && !existing.hebrewNiqqud) {
          seen.set(key, entry);
        }
      }
    } else {
      seen.set(key, entry);
    }
  }

  const deduped = [...seen.values()];
  console.log(`  Deduplicated: ${allEntries.length} -> ${deduped.length} entries`);
  return deduped;
}

// ============================================================================
// STEP 6: Write SQL output
// ============================================================================

function escapeSQL(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + str.replace(/'/g, "''") + "'";
}

function writeSQL(entries, outputPath) {
  console.log(`Writing SQL to ${outputPath}...`);

  // Calculate stats
  const stats = {
    total: entries.length,
    bySource: {},
    byCategory: {},
    byConfidence: {},
  };

  for (const e of entries) {
    stats.bySource[e.source] = (stats.bySource[e.source] || 0) + 1;
    stats.byCategory[e.category] = (stats.byCategory[e.category] || 0) + 1;
    stats.byConfidence[e.confidence] = (stats.byConfidence[e.confidence] || 0) + 1;
  }

  let sql = '';

  // Header
  sql += '-- ============================================================================\n';
  sql += '-- Hebrew-English Dictionary (hebrew_english_dict)\n';
  sql += '-- OUR OWNED VOCABULARY ASSET\n';
  sql += `-- Generated: ${new Date().toISOString().split('T')[0]}\n`;
  sql += '-- \n';
  sql += `-- Total entries: ${stats.total}\n`;
  sql += '-- \n';
  sql += '-- By source:\n';
  Object.entries(stats.bySource).sort((a, b) => b[1] - a[1]).forEach(([src, count]) => {
    sql += `--   ${src}: ${count}\n`;
  });
  sql += '-- \n';
  sql += '-- By category:\n';
  Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    sql += `--   ${cat}: ${count}\n`;
  });
  sql += '-- \n';
  sql += '-- By confidence:\n';
  Object.entries(stats.byConfidence).sort((a, b) => b[1] - a[1]).forEach(([conf, count]) => {
    sql += `--   ${conf}: ${count}\n`;
  });
  sql += '-- \n';
  sql += '-- Sources:\n';
  sql += '--   academy     = Hebrew Academy of Language terms database (126,997 terms)\n';
  sql += '--   composed    = Compound translations built from Academy word pairs\n';
  sql += '--   word-level  = Individual words extracted from multi-word Academy terms\n';
  sql += '-- ============================================================================\n\n';

  // Create table
  sql += 'DROP TABLE IF EXISTS hebrew_english_dict;\n\n';
  sql += `CREATE TABLE IF NOT EXISTS hebrew_english_dict (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    english TEXT NOT NULL,
    hebrew TEXT NOT NULL,
    hebrew_niqqud TEXT,
    category TEXT,
    source TEXT,
    source_dict TEXT,
    confidence TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);\n\n`;

  // Indexes
  sql += 'CREATE INDEX IF NOT EXISTS idx_hed_english ON hebrew_english_dict(english);\n';
  sql += 'CREATE INDEX IF NOT EXISTS idx_hed_hebrew ON hebrew_english_dict(hebrew);\n';
  sql += 'CREATE INDEX IF NOT EXISTS idx_hed_category ON hebrew_english_dict(category);\n\n';

  // Insert entries in batches by category for readability
  const byCategory = {};
  for (const entry of entries) {
    if (!byCategory[entry.category]) byCategory[entry.category] = [];
    byCategory[entry.category].push(entry);
  }

  // Sort categories for consistent output
  const categoryOrder = ['chemistry', 'food', 'biology', 'medicine', 'botany', 'agriculture', 'environment', 'zoology', 'physics', 'general', 'other'];

  for (const cat of categoryOrder) {
    if (!byCategory[cat] || byCategory[cat].length === 0) continue;

    const catEntries = byCategory[cat];
    // Sort by english within category
    catEntries.sort((a, b) => a.english.localeCompare(b.english, 'en'));

    sql += `-- ============================================================================\n`;
    sql += `-- ${cat.toUpperCase()} (${catEntries.length} entries)\n`;
    sql += `-- ============================================================================\n\n`;

    for (const entry of catEntries) {
      const niqqud = entry.hebrewNiqqud ? escapeSQL(entry.hebrewNiqqud) : 'NULL';
      sql += `INSERT INTO hebrew_english_dict (english, hebrew, hebrew_niqqud, category, source, source_dict, confidence) VALUES (${escapeSQL(entry.english)}, ${escapeSQL(entry.hebrew)}, ${niqqud}, ${escapeSQL(entry.category)}, ${escapeSQL(entry.source)}, ${escapeSQL(entry.sourceDict)}, ${escapeSQL(entry.confidence)});\n`;
    }

    sql += '\n';
  }

  fs.writeFileSync(outputPath, sql, 'utf8');
  console.log(`  Written ${entries.length} entries to ${outputPath}`);
  console.log(`  File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('=== Building Hebrew-English Dictionary ===\n');

  const academyPath = path.resolve('C:/BENDA_PROJECT/ROOTS_BY_BENDA/sql_academy/academy_full_126997.sql');
  const compoundPath = path.resolve('C:/BENDA_PROJECT/HEALTHYSCAN/scripts/sql/12-academy-compound-translations.sql');
  const outputPath = path.resolve('C:/BENDA_PROJECT/HEALTHYSCAN/scripts/sql/13-hebrew-english-dict.sql');

  // Step 1: Parse Academy
  const allAcademy = parseAcademySQL(academyPath);

  // Step 2: Filter
  const filtered = filterEntries(allAcademy);

  // Step 3: Parse compound translations
  const compounds = parseCompoundTranslations(compoundPath);

  // Step 4: Extract word-level
  const wordLevel = extractWordLevel(filtered);

  // Step 5: Combine and deduplicate
  const allEntries = [...filtered, ...compounds, ...wordLevel];
  console.log(`\nTotal before dedup: ${allEntries.length}`);

  const deduped = deduplicate(allEntries);

  // Step 6: Write SQL
  writeSQL(deduped, outputPath);

  console.log('\n=== DONE ===');
}

main();
