/**
 * Academy Compound Matcher
 * ========================
 * Builds a word-level translation dictionary from the Hebrew Academy's 126,997 terms,
 * then composes Hebrew translations for food additive names by matching individual words.
 *
 * Strategy:
 * 1. Parse all Academy terms into english->hebrew word mappings
 * 2. Prioritize chemistry/food/biology dictionaries
 * 3. For each missing food additive name, try exact match, then word-by-word composition
 * 4. Apply Hebrew chemical naming rules (noun-adjective order, acid patterns, etc.)
 * 5. Output SQL UPDATE statements with source traceability
 *
 * Usage: node scripts/academy_compound_matcher.js
 *
 * NOTE: This script uses only fs for file I/O. No shell commands or child_process usage.
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const ACADEMY_SQL_PATH = 'C:/BENDA_PROJECT/ROOTS_BY_BENDA/sql_academy/academy_full_126997.sql';
const MISSING_NAMES_PATH = 'C:/BENDA_PROJECT/HEALTHYSCAN/scripts/missing_names_all.json';
const OUTPUT_SQL_PATH = 'C:/BENDA_PROJECT/HEALTHYSCAN/scripts/sql/12-academy-compound-translations.sql';

// Dictionary priority tiers (higher tier = preferred for conflicts)
const DICT_PRIORITY = {
  // Tier 1 - Food & cooking (highest priority for food ingredients)
  'אפייה': 10,
  'כלכלת הבית': 10,
  'מטבח': 10,
  'תבשילים': 10,
  'יין': 9,
  'מזון': 10,

  // Tier 2 - Chemistry
  'כימיה אי-אורגנית': 8,
  'כימיה אורגנית': 8,
  'כימיה כללית': 7,
  'כימיה': 7,
  'הנדסה כימית': 7,

  // Tier 3 - Biology/Botany/Agriculture
  'ביולוגיה': 6,
  'ביוכימיה': 6,
  'בוטניקה': 6,
  'צמחים': 6,
  'חקלאות': 6,
  'מיקרוביולוגיה': 5,
  'איכות הסביבה': 5,

  // Tier 4 - Medicine/Pharmacology
  'רפואה': 4,
  'פרמקולוגיה': 4,
  'בריאות הציבור': 4,

  // Tier 5 - General
  'שימוש כללי': 3,
};

// Genre priority (secondary to dictionary)
const GENRE_PRIORITY = {
  'מזון וכלכלת הבית': 5,
  'מדעי החיים ורפואה': 4,
  'הנדסה': 3,
  'כלכלה': 2,
};

// ============================================================================
// HARDCODED CHEMICAL TERMINOLOGY
// ============================================================================

const CHEMICAL_OVERRIDES = {
  // Elements
  'calcium': { hebrew: 'סידן', dict: 'Chemistry' },
  'sodium': { hebrew: 'נתרן', dict: 'Chemistry' },
  'potassium': { hebrew: 'אשלגן', dict: 'Chemistry' },
  'magnesium': { hebrew: 'מגנזיום', dict: 'Chemistry' },
  'iron': { hebrew: 'ברזל', dict: 'Chemistry' },
  'zinc': { hebrew: 'אבץ', dict: 'Chemistry' },
  'copper': { hebrew: 'נחושת', dict: 'Chemistry' },
  'manganese': { hebrew: 'מנגן', dict: 'Chemistry' },
  'aluminum': { hebrew: 'אלומיניום', dict: 'Chemistry' },
  'aluminium': { hebrew: 'אלומיניום', dict: 'Chemistry' },
  'silicon': { hebrew: 'צורן', dict: 'Chemistry' },
  'phosphorus': { hebrew: 'זרחן', dict: 'Chemistry' },
  'sulfur': { hebrew: 'גופרית', dict: 'Chemistry' },
  'sulphur': { hebrew: 'גופרית', dict: 'Chemistry' },
  'nitrogen': { hebrew: 'חנקן', dict: 'Chemistry' },
  'hydrogen': { hebrew: 'מימן', dict: 'Chemistry' },
  'oxygen': { hebrew: 'חמצן', dict: 'Chemistry' },
  'chlorine': { hebrew: 'כלור', dict: 'Chemistry' },
  'bromine': { hebrew: 'ברום', dict: 'Chemistry' },
  'iodine': { hebrew: 'יוד', dict: 'Chemistry' },
  'tin': { hebrew: 'בדיל', dict: 'Chemistry' },
  'silver': { hebrew: 'כסף', dict: 'Chemistry' },
  'gold': { hebrew: 'זהב', dict: 'Chemistry' },
  'titanium': { hebrew: 'טיטניום', dict: 'Chemistry' },
  'chromium': { hebrew: 'כרום', dict: 'Chemistry' },
  'selenium': { hebrew: 'סלניום', dict: 'Chemistry' },
  'molybdenum': { hebrew: 'מוליבדן', dict: 'Chemistry' },
  'cobalt': { hebrew: 'קובלט', dict: 'Chemistry' },
  'nickel': { hebrew: 'ניקל', dict: 'Chemistry' },
  'boron': { hebrew: 'בור', dict: 'Chemistry' },
  'lithium': { hebrew: 'ליתיום', dict: 'Chemistry' },
  'barium': { hebrew: 'בריום', dict: 'Chemistry' },
  'strontium': { hebrew: 'סטרונציום', dict: 'Chemistry' },
  'carbon': { hebrew: 'פחמן', dict: 'Chemistry' },
  'ferrous': { hebrew: 'ברזלי', dict: 'Chemistry' },
  'ferric': { hebrew: 'ברזלי', dict: 'Chemistry' },
  'ammonium': { hebrew: 'אמוניום', dict: 'Chemistry' },

  // Common chemical groups
  'anhydride': { hebrew: 'אנהידריד', dict: 'Chemistry' },
  'acetic': { hebrew: 'אצטי', dict: 'Chemistry' },
  'oxide': { hebrew: 'תחמוצת', dict: 'Chemistry' },
  'dioxide': { hebrew: 'דו-תחמוצת', dict: 'Chemistry' },
  'monoxide': { hebrew: 'חד-תחמוצת', dict: 'Chemistry' },
  'trioxide': { hebrew: 'תלת-תחמוצת', dict: 'Chemistry' },
  'peroxide': { hebrew: 'על-תחמוצת', dict: 'Chemistry' },
  'hydroxide': { hebrew: 'הידרוקסיד', dict: 'Chemistry' },
  'chloride': { hebrew: 'כלוריד', dict: 'Chemistry' },
  'bromide': { hebrew: 'ברומיד', dict: 'Chemistry' },
  'iodide': { hebrew: 'יודיד', dict: 'Chemistry' },
  'fluoride': { hebrew: 'פלואוריד', dict: 'Chemistry' },
  'sulfate': { hebrew: 'סולפט', dict: 'Chemistry' },
  'sulphate': { hebrew: 'סולפט', dict: 'Chemistry' },
  'sulfite': { hebrew: 'סולפיט', dict: 'Chemistry' },
  'sulphite': { hebrew: 'סולפיט', dict: 'Chemistry' },
  'sulfide': { hebrew: 'סולפיד', dict: 'Chemistry' },
  'sulphide': { hebrew: 'סולפיד', dict: 'Chemistry' },
  'phosphate': { hebrew: 'פוספט', dict: 'Chemistry' },
  'phosphite': { hebrew: 'פוספיט', dict: 'Chemistry' },
  'carbonate': { hebrew: 'קרבונט', dict: 'Chemistry' },
  'bicarbonate': { hebrew: 'ביקרבונט', dict: 'Chemistry' },
  'nitrate': { hebrew: 'ניטרט', dict: 'Chemistry' },
  'nitrite': { hebrew: 'ניטריט', dict: 'Chemistry' },
  'acetate': { hebrew: 'אצטט', dict: 'Chemistry' },
  'citrate': { hebrew: 'ציטרט', dict: 'Chemistry' },
  'lactate': { hebrew: 'לקטט', dict: 'Chemistry' },
  'tartrate': { hebrew: 'טרטרט', dict: 'Chemistry' },
  'benzoate': { hebrew: 'בנזואט', dict: 'Chemistry' },
  'sorbate': { hebrew: 'סורבט', dict: 'Chemistry' },
  'propionate': { hebrew: 'פרופיונט', dict: 'Chemistry' },
  'butyrate': { hebrew: 'בוטירט', dict: 'Chemistry' },
  'formate': { hebrew: 'פורמט', dict: 'Chemistry' },
  'fumarate': { hebrew: 'פומרט', dict: 'Chemistry' },
  'malate': { hebrew: 'מלט', dict: 'Chemistry' },
  'succinate': { hebrew: 'סוקצינט', dict: 'Chemistry' },
  'glutamate': { hebrew: 'גלוטמט', dict: 'Chemistry' },
  'stearate': { hebrew: 'סטארט', dict: 'Chemistry' },
  'oleate': { hebrew: 'אולאט', dict: 'Chemistry' },
  'palmitate': { hebrew: 'פלמיטט', dict: 'Chemistry' },
  'silicate': { hebrew: 'סיליקט', dict: 'Chemistry' },
  'aluminate': { hebrew: 'אלומינט', dict: 'Chemistry' },
  'caseinate': { hebrew: 'קזאינט', dict: 'Chemistry' },
  'alginate': { hebrew: 'אלגינט', dict: 'Chemistry' },
  'gluconate': { hebrew: 'גלוקונט', dict: 'Chemistry' },
  'ascorbate': { hebrew: 'אסקורבט', dict: 'Chemistry' },

  // Acids
  'acid': { hebrew: 'חומצה', dict: 'Chemistry' },

  // Common food/chemical terms
  'starch': { hebrew: 'עמילן', dict: 'Food' },
  'sugar': { hebrew: 'סוכר', dict: 'Food' },
  'salt': { hebrew: 'מלח', dict: 'Food' },
  'water': { hebrew: 'מים', dict: 'General' },
  'oil': { hebrew: 'שמן', dict: 'Food' },
  'fat': { hebrew: 'שומן', dict: 'Food' },
  'wax': { hebrew: 'שעווה', dict: 'Food' },
  'gum': { hebrew: 'גומי', dict: 'Food' },
  'resin': { hebrew: 'שרף', dict: 'Chemistry' },
  'protein': { hebrew: 'חלבון', dict: 'Biology' },
  'gelatin': { hebrew: 'ג\'לטין', dict: 'Food' },
  'gelatine': { hebrew: 'ג\'לטין', dict: 'Food' },
  'pectin': { hebrew: 'פקטין', dict: 'Food' },
  'cellulose': { hebrew: 'תאית', dict: 'Chemistry' },
  'glucose': { hebrew: 'גלוקוז', dict: 'Chemistry' },
  'fructose': { hebrew: 'פרוקטוז', dict: 'Chemistry' },
  'sucrose': { hebrew: 'סוכרוז', dict: 'Chemistry' },
  'lactose': { hebrew: 'לקטוז', dict: 'Chemistry' },
  'maltose': { hebrew: 'מלטוז', dict: 'Chemistry' },
  'dextrose': { hebrew: 'דקסטרוז', dict: 'Chemistry' },
  'sorbitol': { hebrew: 'סורביטול', dict: 'Chemistry' },
  'mannitol': { hebrew: 'מניטול', dict: 'Chemistry' },
  'xylitol': { hebrew: 'קסיליטול', dict: 'Chemistry' },
  'glycerol': { hebrew: 'גליצרול', dict: 'Chemistry' },
  'glycerin': { hebrew: 'גליצרין', dict: 'Chemistry' },
  'glycerine': { hebrew: 'גליצרין', dict: 'Chemistry' },
  'alcohol': { hebrew: 'אלכוהול', dict: 'Chemistry' },
  'ethanol': { hebrew: 'אתנול', dict: 'Chemistry' },
  'methanol': { hebrew: 'מתנול', dict: 'Chemistry' },
  'ester': { hebrew: 'אסתר', dict: 'Chemistry' },
  'esters': { hebrew: 'אסתרים', dict: 'Chemistry' },
  'ether': { hebrew: 'אתר', dict: 'Chemistry' },
  'ketone': { hebrew: 'קטון', dict: 'Chemistry' },
  'aldehyde': { hebrew: 'אלדהיד', dict: 'Chemistry' },
  'phenol': { hebrew: 'פנול', dict: 'Chemistry' },
  'amine': { hebrew: 'אמין', dict: 'Chemistry' },
  'amide': { hebrew: 'אמיד', dict: 'Chemistry' },
  'amino': { hebrew: 'אמינו', dict: 'Chemistry' },
  'methyl': { hebrew: 'מתיל', dict: 'Chemistry' },
  'ethyl': { hebrew: 'אתיל', dict: 'Chemistry' },
  'propyl': { hebrew: 'פרופיל', dict: 'Chemistry' },
  'butyl': { hebrew: 'בוטיל', dict: 'Chemistry' },
  'amyl': { hebrew: 'אמיל', dict: 'Chemistry' },
  'benzyl': { hebrew: 'בנזיל', dict: 'Chemistry' },
  'vinyl': { hebrew: 'ויניל', dict: 'Chemistry' },
  'allyl': { hebrew: 'אליל', dict: 'Chemistry' },

  // Common qualifiers
  'modified': { hebrew: 'מותמר', dict: 'Food' },
  'natural': { hebrew: 'טבעי', dict: 'General' },
  'synthetic': { hebrew: 'סינתטי', dict: 'General' },
  'refined': { hebrew: 'מזוקק', dict: 'Chemistry' },
  'pure': { hebrew: 'טהור', dict: 'General' },
  'concentrated': { hebrew: 'מרוכז', dict: 'General' },
  'powdered': { hebrew: 'אבקתי', dict: 'Food' },
  'liquid': { hebrew: 'נוזלי', dict: 'General' },
  'crystalline': { hebrew: 'גבישי', dict: 'Chemistry' },
  'anhydrous': { hebrew: 'נטול מים', dict: 'Chemistry' },
  'extract': { hebrew: 'תמצית', dict: 'Food' },
  'essence': { hebrew: 'תמצית', dict: 'Food' },
  'syrup': { hebrew: 'סירופ', dict: 'Food' },
  'powder': { hebrew: 'אבקה', dict: 'Food' },
  'solution': { hebrew: 'תמיסה', dict: 'Chemistry' },
  'emulsion': { hebrew: 'תחליב', dict: 'Chemistry' },

  // Colors
  'red': { hebrew: 'אדום', dict: 'General' },
  'blue': { hebrew: 'כחול', dict: 'General' },
  'green': { hebrew: 'ירוק', dict: 'General' },
  'yellow': { hebrew: 'צהוב', dict: 'General' },
  'brown': { hebrew: 'חום', dict: 'General' },
  'black': { hebrew: 'שחור', dict: 'General' },
  'white': { hebrew: 'לבן', dict: 'General' },
  'orange': { hebrew: 'כתום', dict: 'General' },

  // Food-specific compounds
  'polysorbate': { hebrew: 'פוליסורבט', dict: 'Chemistry' },
  'carrageenan': { hebrew: 'קרגינן', dict: 'Food' },
  'lecithin': { hebrew: 'לציתין', dict: 'Chemistry' },
  'carotene': { hebrew: 'קרוטן', dict: 'Chemistry' },
  'riboflavin': { hebrew: 'ריבופלבין', dict: 'Chemistry' },
  'thiamine': { hebrew: 'תיאמין', dict: 'Chemistry' },
  'niacin': { hebrew: 'ניאצין', dict: 'Chemistry' },
  'biotin': { hebrew: 'ביוטין', dict: 'Chemistry' },
  'tocopherol': { hebrew: 'טוקופרול', dict: 'Chemistry' },
  'retinol': { hebrew: 'רטינול', dict: 'Chemistry' },
  'inositol': { hebrew: 'אינוזיטול', dict: 'Chemistry' },
  'choline': { hebrew: 'כולין', dict: 'Chemistry' },
  'taurine': { hebrew: 'טאורין', dict: 'Chemistry' },
  'caffeine': { hebrew: 'קפאין', dict: 'Chemistry' },
  'lycopene': { hebrew: 'ליקופן', dict: 'Chemistry' },
  'lutein': { hebrew: 'לוטאין', dict: 'Chemistry' },
  'carmine': { hebrew: 'כרמין', dict: 'Chemistry' },
  'curcumin': { hebrew: 'כורכומין', dict: 'Chemistry' },
  'annatto': { hebrew: 'אנאטו', dict: 'Food' },
  'paprika': { hebrew: 'פפריקה', dict: 'Food' },
  'turmeric': { hebrew: 'כורכום', dict: 'Food' },
  'saffron': { hebrew: 'זעפרן', dict: 'Food' },

  // Gums
  'xanthan': { hebrew: 'קסנטן', dict: 'Food' },
  'guar': { hebrew: 'גואר', dict: 'Food' },
  'arabic': { hebrew: 'ערבי', dict: 'General' },
  'carob': { hebrew: 'חרוב', dict: 'Food' },
  'agar': { hebrew: 'אגר', dict: 'Food' },
  'gellan': { hebrew: 'ג\'לן', dict: 'Food' },

  // Sweeteners
  'aspartame': { hebrew: 'אספרטם', dict: 'Food' },
  'saccharin': { hebrew: 'סכרין', dict: 'Chemistry' },
  'stevia': { hebrew: 'סטיביה', dict: 'Food' },
  'sucralose': { hebrew: 'סוכרלוז', dict: 'Food' },
  'maltitol': { hebrew: 'מלטיטול', dict: 'Food' },
  'erythritol': { hebrew: 'אריתריטול', dict: 'Food' },
  'isomalt': { hebrew: 'איזומלט', dict: 'Food' },
  'lactitol': { hebrew: 'לקטיטול', dict: 'Food' },
};

// ============================================================================
// COMPOUND PATTERNS - Manually verified full-name translations
// ============================================================================

const COMPOUND_PATTERNS = {
  // === Calcium compounds ===
  'calcium carbonate': 'קרבונט סידן',
  'calcium chloride': 'כלוריד סידן',
  'calcium sulfate': 'סולפט סידן',
  'calcium sulphate': 'סולפט סידן',
  'calcium phosphate': 'פוספט סידן',
  'calcium citrate': 'ציטרט סידן',
  'calcium lactate': 'לקטט סידן',
  'calcium hydroxide': 'הידרוקסיד סידן',
  'calcium oxide': 'תחמוצת סידן',
  'calcium silicate': 'סיליקט סידן',
  'calcium stearate': 'סטארט סידן',
  'calcium gluconate': 'גלוקונט סידן',
  'calcium ascorbate': 'אסקורבט סידן',
  'calcium sorbate': 'סורבט סידן',
  'calcium propionate': 'פרופיונט סידן',
  'calcium acetate': 'אצטט סידן',
  'calcium benzoate': 'בנזואט סידן',
  'calcium alginate': 'אלגינט סידן',
  'calcium tartrate': 'טרטרט סידן',
  'calcium fumarate': 'פומרט סידן',
  'calcium malate': 'מלט סידן',
  'calcium succinate': 'סוקצינט סידן',
  'calcium caseinate': 'קזאינט סידן',
  'calcium pantothenate': 'פנטותנט סידן',
  'calcium peroxide': 'על-תחמוצת סידן',
  'calcium iodate': 'יודט סידן',
  'calcium fluoride': 'פלואוריד סידן',

  // === Sodium compounds ===
  'sodium chloride': 'כלוריד נתרן',
  'sodium carbonate': 'קרבונט נתרן',
  'sodium bicarbonate': 'ביקרבונט נתרן',
  'sodium hydroxide': 'הידרוקסיד נתרן',
  'sodium phosphate': 'פוספט נתרן',
  'sodium citrate': 'ציטרט נתרן',
  'sodium lactate': 'לקטט נתרן',
  'sodium sulfate': 'סולפט נתרן',
  'sodium sulphate': 'סולפט נתרן',
  'sodium sulfite': 'סולפיט נתרן',
  'sodium sulphite': 'סולפיט נתרן',
  'sodium benzoate': 'בנזואט נתרן',
  'sodium sorbate': 'סורבט נתרן',
  'sodium propionate': 'פרופיונט נתרן',
  'sodium acetate': 'אצטט נתרן',
  'sodium nitrate': 'ניטרט נתרן',
  'sodium nitrite': 'ניטריט נתרן',
  'sodium silicate': 'סיליקט נתרן',
  'sodium stearate': 'סטארט נתרן',
  'sodium alginate': 'אלגינט נתרן',
  'sodium ascorbate': 'אסקורבט נתרן',
  'sodium gluconate': 'גלוקונט נתרן',
  'sodium glutamate': 'גלוטמט נתרן',
  'sodium caseinate': 'קזאינט נתרן',
  'sodium tartrate': 'טרטרט נתרן',
  'sodium fumarate': 'פומרט נתרן',
  'sodium malate': 'מלט נתרן',
  'sodium erythorbate': 'אריתורבט נתרן',
  'sodium metabisulfite': 'מטביסולפיט נתרן',
  'sodium metabisulphite': 'מטביסולפיט נתרן',
  'sodium bisulfite': 'ביסולפיט נתרן',
  'sodium bisulphite': 'ביסולפיט נתרן',
  'sodium fluoride': 'פלואוריד נתרן',
  'sodium stearoyl lactylate': 'סטארואיל לקטילט נתרן',

  // === Potassium compounds ===
  'potassium chloride': 'כלוריד אשלגן',
  'potassium carbonate': 'קרבונט אשלגן',
  'potassium bicarbonate': 'ביקרבונט אשלגן',
  'potassium hydroxide': 'הידרוקסיד אשלגן',
  'potassium phosphate': 'פוספט אשלגן',
  'potassium citrate': 'ציטרט אשלגן',
  'potassium lactate': 'לקטט אשלגן',
  'potassium sulfate': 'סולפט אשלגן',
  'potassium sulphate': 'סולפט אשלגן',
  'potassium sorbate': 'סורבט אשלגן',
  'potassium benzoate': 'בנזואט אשלגן',
  'potassium nitrate': 'ניטרט אשלגן',
  'potassium nitrite': 'ניטריט אשלגן',
  'potassium alginate': 'אלגינט אשלגן',
  'potassium acetate': 'אצטט אשלגן',
  'potassium tartrate': 'טרטרט אשלגן',
  'potassium gluconate': 'גלוקונט אשלגן',
  'potassium propionate': 'פרופיונט אשלגן',
  'potassium metabisulfite': 'מטביסולפיט אשלגן',
  'potassium metabisulphite': 'מטביסולפיט אשלגן',
  'potassium bisulfite': 'ביסולפיט אשלגן',
  'potassium bisulphite': 'ביסולפיט אשלגן',
  'potassium iodate': 'יודט אשלגן',
  'potassium iodide': 'יודיד אשלגן',
  'potassium bromate': 'ברומט אשלגן',
  'potassium ferrocyanide': 'פרוציאניד אשלגן',

  // === Magnesium compounds ===
  'magnesium carbonate': 'קרבונט מגנזיום',
  'magnesium chloride': 'כלוריד מגנזיום',
  'magnesium hydroxide': 'הידרוקסיד מגנזיום',
  'magnesium oxide': 'תחמוצת מגנזיום',
  'magnesium phosphate': 'פוספט מגנזיום',
  'magnesium sulfate': 'סולפט מגנזיום',
  'magnesium sulphate': 'סולפט מגנזיום',
  'magnesium silicate': 'סיליקט מגנזיום',
  'magnesium stearate': 'סטארט מגנזיום',
  'magnesium citrate': 'ציטרט מגנזיום',
  'magnesium gluconate': 'גלוקונט מגנזיום',
  'magnesium lactate': 'לקטט מגנזיום',

  // === Iron compounds ===
  'iron oxide': 'תחמוצת ברזל',
  'ferrous sulfate': 'סולפט ברזלי',
  'ferrous sulphate': 'סולפט ברזלי',
  'ferrous gluconate': 'גלוקונט ברזלי',
  'ferrous lactate': 'לקטט ברזלי',
  'ferrous fumarate': 'פומרט ברזלי',
  'ferric phosphate': 'פוספט ברזלי',
  'ferric citrate': 'ציטרט ברזלי',

  // === Zinc compounds ===
  'zinc oxide': 'תחמוצת אבץ',
  'zinc chloride': 'כלוריד אבץ',
  'zinc sulfate': 'סולפט אבץ',
  'zinc sulphate': 'סולפט אבץ',
  'zinc gluconate': 'גלוקונט אבץ',
  'zinc acetate': 'אצטט אבץ',
  'zinc citrate': 'ציטרט אבץ',
  'zinc stearate': 'סטארט אבץ',

  // === Common acids ===
  'citric acid': 'חומצת לימון',
  'acetic acid': 'חומצת חומץ',
  'lactic acid': 'חומצת חלב',
  'tartaric acid': 'חומצת יין',
  'malic acid': 'חומצת תפוחים',
  'fumaric acid': 'חומצה פומרית',
  'succinic acid': 'חומצה ענברית',
  'adipic acid': 'חומצה אדיפית',
  'benzoic acid': 'חומצה בנזואית',
  'sorbic acid': 'חומצה סורבית',
  'propionic acid': 'חומצה פרופיונית',
  'formic acid': 'חומצה נמלית',
  'butyric acid': 'חומצה חמאתית',
  'ascorbic acid': 'חומצה אסקורבית',
  'stearic acid': 'חומצה סטארית',
  'oleic acid': 'חומצה אולאית',
  'palmitic acid': 'חומצה פלמיטית',
  'linoleic acid': 'חומצה לינולאית',
  'linolenic acid': 'חומצה לינולנית',
  'erythorbic acid': 'חומצה אריתורבית',
  'phosphoric acid': 'חומצה זרחתית',
  'hydrochloric acid': 'חומצת מלח',
  'sulfuric acid': 'חומצה גופרתית',
  'sulphuric acid': 'חומצה גופרתית',
  'nitric acid': 'חומצה חנקתית',
  'carbonic acid': 'חומצה פחמתית',
  'boric acid': 'חומצה בורית',
  'glutamic acid': 'חומצה גלוטמית',
  'alginic acid': 'חומצה אלגינית',
  'tannic acid': 'חומצה טנינית',
  'folic acid': 'חומצה פולית',
  'nicotinic acid': 'חומצה ניקוטינית',
  'pantothenic acid': 'חומצה פנטותנית',
  'phytic acid': 'חומצה פיטית',
  'oxalic acid': 'חומצה חומצנית',
  'capric acid': 'חומצה קפרית',
  'caprylic acid': 'חומצה קפרילית',
  'lauric acid': 'חומצה לאורית',
  'myristic acid': 'חומצה מיריסטית',
  'valeric acid': 'חומצה ולרית',

  // === Dioxide compounds ===
  'titanium dioxide': 'דו-תחמוצת טיטניום',
  'silicon dioxide': 'דו-תחמוצת צורן',
  'carbon dioxide': 'דו-תחמוצת פחמן',
  'sulfur dioxide': 'דו-תחמוצת גופרית',
  'sulphur dioxide': 'דו-תחמוצת גופרית',
  'chlorine dioxide': 'דו-תחמוצת כלור',

  // === Common food additives (complex) ===
  'monosodium glutamate': 'גלוטמט חד-נתרני',
  'carboxymethyl cellulose': 'קרבוקסימתיל תאית',
  'microcrystalline cellulose': 'תאית מיקרו-גבישית',
  'methylcellulose': 'מתיל תאית',
  'hydroxypropyl methylcellulose': 'הידרוקסיפרופיל מתיל תאית',
  'modified starch': 'עמילן מותמר',
  'modified food starch': 'עמילן מזון מותמר',
  'corn starch': 'עמילן תירס',
  'potato starch': 'עמילן תפוחי אדמה',
  'wheat starch': 'עמילן חיטה',
  'rice starch': 'עמילן אורז',
  'tapioca starch': 'עמילן טפיוקה',
  'gum arabic': 'גומי ערבי',
  'guar gum': 'גומי גואר',
  'xanthan gum': 'גומי קסנטן',
  'locust bean gum': 'גומי חרובים',
  'carob bean gum': 'גומי חרובים',
  'tara gum': 'גומי טרה',
  'gellan gum': 'גומי ג\'לן',
  'agar agar': 'אגר אגר',
  'mono and diglycerides': 'מונו ודיגליצרידים',
  'soy lecithin': 'לציתין סויה',
  'sunflower lecithin': 'לציתין חמניות',
  'beta carotene': 'בטא קרוטן',
  'alpha tocopherol': 'אלפא טוקופרול',
  'butylated hydroxytoluene': 'בוטילהידרוקסיטולואן',
  'butylated hydroxyanisole': 'בוטילהידרוקסיאניזול',
  'propyl gallate': 'פרופיל גלט',
  'calcium lactate gluconate': 'לקטט גלוקונט סידן',
  'sodium stearoyl-2-lactylate': 'סטארואיל לקטילט נתרן',
  'calcium stearoyl-2-lactylate': 'סטארואיל לקטילט סידן',

  // === Ammonium compounds ===
  'ammonium carbonate': 'קרבונט אמוניום',
  'ammonium bicarbonate': 'ביקרבונט אמוניום',
  'ammonium chloride': 'כלוריד אמוניום',
  'ammonium sulfate': 'סולפט אמוניום',
  'ammonium sulphate': 'סולפט אמוניום',
  'ammonium phosphate': 'פוספט אמוניום',
  'ammonium citrate': 'ציטרט אמוניום',
  'ammonium hydroxide': 'הידרוקסיד אמוניום',
  'ammonium alginate': 'אלגינט אמוניום',
  'ammonium adipate': 'אדיפט אמוניום',
  'ammonium fumarate': 'פומרט אמוניום',
  'ammonium lactate': 'לקטט אמוניום',
  'ammonium malate': 'מלט אמוניום',
  'ammonium polyphosphate': 'פוליפוספט אמוניום',
  'ammonium ferric citrate': 'ציטרט ברזלי אמוניום',

  // === Manganese/Copper/other metal compounds ===
  'manganese sulfate': 'סולפט מנגן',
  'manganese sulphate': 'סולפט מנגן',
  'manganese gluconate': 'גלוקונט מנגן',
  'manganese chloride': 'כלוריד מנגן',
  'copper sulfate': 'סולפט נחושת',
  'copper sulphate': 'סולפט נחושת',
  'copper gluconate': 'גלוקונט נחושת',
  'copper chloride': 'כלוריד נחושת',

  // === Additional calcium ===
  'calcium pyrophosphate': 'פירופוספט סידן',
  'calcium hexametaphosphate': 'הקסמטפוספט סידן',
  'calcium polyphosphate': 'פוליפוספט סידן',
  'calcium formate': 'פורמט סידן',
  'calcium cyclamate': 'ציקלמט סידן',
  'calcium saccharin': 'סכרין סידן',

  // === Additional sodium ===
  'sodium diacetate': 'דו-אצטט נתרן',
  'sodium formate': 'פורמט נתרן',
  'sodium pyrophosphate': 'פירופוספט נתרן',
  'sodium polyphosphate': 'פוליפוספט נתרן',
  'sodium tripolyphosphate': 'טריפוליפוספט נתרן',
  'sodium cyclamate': 'ציקלמט נתרן',
  'sodium saccharin': 'סכרין נתרן',
  'sodium dehydroacetate': 'דהידרואצטט נתרן',
  'sodium silicate': 'סיליקט נתרן',

  // === Additional potassium ===
  'potassium ascorbate': 'אסקורבט אשלגן',
  'potassium fumarate': 'פומרט אשלגן',
  'potassium pyrophosphate': 'פירופוספט אשלגן',
  'potassium polyphosphate': 'פוליפוספט אשלגן',
  'potassium sulfite': 'סולפיט אשלגן',
  'potassium saccharin': 'סכרין אשלגן',

  // === Additional iron ===
  'iron oxide black': 'תחמוצת ברזל שחורה',
  'iron oxide red': 'תחמוצת ברזל אדומה',
  'iron oxide yellow': 'תחמוצת ברזל צהובה',
  'iron tartrate': 'טרטרט ברזל',
  'ferrous carbonate': 'קרבונט ברזלי',
  'ferric pyrophosphate': 'פירופוספט ברזלי',

  // === Additional zinc ===
  'zinc carbonate': 'קרבונט אבץ',
  'zinc stearate': 'סטארט אבץ',

  // === Additional magnesium ===
  'magnesium fumarate': 'פומרט מגנזיום',

  // === Manganese ===
  'manganese citrate': 'ציטרט מנגן',

  // === Aluminium multi-element ===
  'aluminium sulfate': 'סולפט אלומיניום',
  'aluminium sulphate': 'סולפט אלומיניום',
  'aluminium ammonium sulfate': 'סולפט אלומיניום אמוניום',
  'aluminium ammonium sulphate': 'סולפט אלומיניום אמוניום',
  'aluminium potassium sulfate': 'סולפט אלומיניום אשלגן',
  'aluminium potassium sulphate': 'סולפט אלומיניום אשלגן',
  'aluminium sodium sulfate': 'סולפט אלומיניום נתרן',
  'aluminium sodium sulphate': 'סולפט אלומיניום נתרן',
  'aluminum sulfate': 'סולפט אלומיניום',
  'aluminum ammonium sulfate': 'סולפט אלומיניום אמוניום',
  'aluminum potassium sulfate': 'סולפט אלומיניום אשלגן',
  'sodium aluminum sulfate': 'סולפט אלומיניום נתרן',

  // === Extra food-relevant compounds ===
  'acetic anhydride': 'אנהידריד אצטי',
  'sodium selenate': 'סלנט נתרן',
  'sodium selenite': 'סלניט נתרן',
  'potassium bisulfate': 'ביסולפט אשלגן',
  'sodium bisulfate': 'ביסולפט נתרן',
  'calcium sulfate food grade': 'סולפט סידן',
  'magnesium sulfate': 'סולפט מגנזיום',
  'manganese sulfate': 'סולפט מנגן',
  'zinc sulfate': 'סולפט אבץ',
  'zinc gluconate': 'גלוקונט אבץ',
  'zinc oxide': 'תחמוצת אבץ',

  // === Common food acids (additional forms) ===
  'gluconic acid': 'חומצה גלוקונית',
  'cinnamic acid': 'חומצה קינמית',
  'salicylic acid': 'חומצה סליצילית',
  'caffeic acid': 'חומצה קפאית',
  'gallic acid': 'חומצה גלית',
  'ellagic acid': 'חומצה אלגית',
  'rosmarinic acid': 'חומצה רוזמרינית',
  'chlorogenic acid': 'חומצה כלורוגנית',
  'ferulic acid': 'חומצה פרולית',
  'dehydroacetic acid': 'חומצה דהידרואצטית',
  'carnosic acid': 'חומצה קרנוסית',
  'erucic acid': 'חומצה ארוצית',
  'd-gluconic acid': 'חומצה D-גלוקונית',

  // === Vitamins ===
  'vitamin a': 'ויטמין A',
  'vitamin b1': 'ויטמין B1',
  'vitamin b2': 'ויטמין B2',
  'vitamin b3': 'ויטמין B3',
  'vitamin b5': 'ויטמין B5',
  'vitamin b6': 'ויטמין B6',
  'vitamin b12': 'ויטמין B12',
  'vitamin c': 'ויטמין C',
  'vitamin d': 'ויטמין D',
  'vitamin d2': 'ויטמין D2',
  'vitamin d3': 'ויטמין D3',
  'vitamin e': 'ויטמין E',
  'vitamin k': 'ויטמין K',
  'vitamin k1': 'ויטמין K1',
  'vitamin k2': 'ויטמין K2',
};

// ============================================================================
// ACID COMPOSITION RULES
// ============================================================================

// "chomtzat X" (of-construct) pattern
const ACID_OF_CONSTRUCT = {
  'citric': 'חומצת לימון',
  'acetic': 'חומצת חומץ',
  'lactic': 'חומצת חלב',
  'tartaric': 'חומצת יין',
  'malic': 'חומצת תפוחים',
  'hydrochloric': 'חומצת מלח',
};

// "chomtza X-it" (adjective form) pattern
const ACID_ADJECTIVE = {
  'fumaric': 'חומצה פומרית',
  'succinic': 'חומצה ענברית',
  'adipic': 'חומצה אדיפית',
  'benzoic': 'חומצה בנזואית',
  'sorbic': 'חומצה סורבית',
  'propionic': 'חומצה פרופיונית',
  'formic': 'חומצה נמלית',
  'butyric': 'חומצה חמאתית',
  'ascorbic': 'חומצה אסקורבית',
  'stearic': 'חומצה סטארית',
  'oleic': 'חומצה אולאית',
  'palmitic': 'חומצה פלמיטית',
  'erythorbic': 'חומצה אריתורבית',
  'phosphoric': 'חומצה זרחתית',
  'sulfuric': 'חומצה גופרתית',
  'sulphuric': 'חומצה גופרתית',
  'nitric': 'חומצה חנקתית',
  'carbonic': 'חומצה פחמתית',
  'boric': 'חומצה בורית',
  'silicic': 'חומצה צורנית',
  'glutamic': 'חומצה גלוטמית',
  'alginic': 'חומצה אלגינית',
  'tannic': 'חומצה טנינית',
  'folic': 'חומצה פולית',
  'nicotinic': 'חומצה ניקוטינית',
  'pantothenic': 'חומצה פנטותנית',
  'phytic': 'חומצה פיטית',
  'oxalic': 'חומצה חומצנית',
  'linoleic': 'חומצה לינולאית',
  'linolenic': 'חומצה לינולנית',
  'arachidonic': 'חומצה ארכידונית',
  'capric': 'חומצה קפרית',
  'caprylic': 'חומצה קפרילית',
  'lauric': 'חומצה לאורית',
  'myristic': 'חומצה מיריסטית',
  'valeric': 'חומצה ולרית',
  'gibberellic': 'חומצה ג\'יברלית',
  'inosinic': 'חומצה אינוזינית',
  'guanylic': 'חומצה גואנילית',
  'gluconic': 'חומצה גלוקונית',
  'cinnamic': 'חומצה קינמית',
  'salicylic': 'חומצה סליצילית',
  'caffeic': 'חומצה קפאית',
  'gallic': 'חומצה גלית',
  'ellagic': 'חומצה אלגית',
  'rosmarinic': 'חומצה רוזמרינית',
  'chlorogenic': 'חומצה כלורוגנית',
  'ferulic': 'חומצה פרולית',
  'dehydroacetic': 'חומצה דהידרואצטית',
  'carnosic': 'חומצה קרנוסית',
  'erucic': 'חומצה ארוצית',
  'pyruvic': 'חומצה פירובית',
  'levulinic': 'חומצה לבולינית',
  'vanillic': 'חומצה ונילית',
  'isobutyric': 'חומצה איזובוטירית',
  'isovaleric': 'חומצה איזוולרית',
  'geranic': 'חומצה גרנית',
  'hexanoic': 'חומצה הקסנואית',
  'nonanoic': 'חומצה נונאנואית',
  'decanoic': 'חומצה דקנואית',
  'undecanoic': 'חומצה אונדקנואית',
  'phenylacetic': 'חומצה פניל-אצטית',
  'phenoxyacetic': 'חומצה פנוקסי-אצטית',
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

function getDictPriority(dictName) {
  let maxPriority = 1;
  for (const [key, priority] of Object.entries(DICT_PRIORITY)) {
    if (dictName.includes(key)) {
      maxPriority = Math.max(maxPriority, priority);
    }
  }
  return maxPriority;
}

function getGenrePriority(genre) {
  let maxPriority = 1;
  for (const [key, priority] of Object.entries(GENRE_PRIORITY)) {
    if (genre.includes(key)) {
      maxPriority = Math.max(maxPriority, priority);
    }
  }
  return maxPriority;
}

function parseAcademySQL(filePath) {
  console.log('Reading Academy SQL from ' + filePath + '...');
  const data = fs.readFileSync(filePath, 'utf8');

  const terms = [];
  const re = /VALUES\s*\('([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'\)/g;
  let m;
  while ((m = re.exec(data)) !== null) {
    terms.push({
      hebrew_niqqud: m[1],
      hebrew: m[2],
      english: m[3],
      dictionary: m[4],
      genre: m[5],
    });
  }

  console.log('  Parsed ' + terms.length + ' Academy terms');
  return terms;
}

function buildWordDictionary(terms) {
  console.log('\nBuilding word-level dictionary...');

  // Full phrase dictionary (english -> { hebrew, dict, genre, priority })
  const phraseDict = new Map();
  // Word-level dictionary
  const wordDict = new Map();
  // Category metadata
  const categoryMap = new Map();

  for (const term of terms) {
    const eng = term.english.toLowerCase().trim();
    if (!eng || eng.length < 2) continue;

    const dictPriority = getDictPriority(term.dictionary);
    const genrePriority = getGenrePriority(term.genre);
    const totalPriority = dictPriority * 10 + genrePriority;

    const entry = {
      hebrew: term.hebrew,
      hebrew_niqqud: term.hebrew_niqqud,
      dictionary: term.dictionary,
      genre: term.genre,
      priority: totalPriority,
    };

    // Register full phrase
    if (!phraseDict.has(eng) || phraseDict.get(eng).priority < totalPriority) {
      phraseDict.set(eng, entry);
    }

    // Register individual words from single-word-to-single-word terms only
    const engWords = eng.split(/\s+/);
    const hebWords = term.hebrew.split(/\s+/);

    if (engWords.length === 1 && hebWords.length === 1) {
      const word = engWords[0];
      if (word.length >= 2) {
        if (!wordDict.has(word) || wordDict.get(word).priority < totalPriority) {
          wordDict.set(word, entry);
        }
      }
    }

    // Store category metadata
    if (term.genre && eng) {
      categoryMap.set(eng, {
        genre: term.genre,
        dictionary: term.dictionary,
      });
    }
  }

  console.log('  Full phrase entries: ' + phraseDict.size);
  console.log('  Word-level entries: ' + wordDict.size);

  return { phraseDict, wordDict, categoryMap };
}

function addChemicalOverrides(wordDict) {
  console.log('\nAdding chemical terminology overrides...');
  let added = 0;
  let overridden = 0;

  for (const [eng, info] of Object.entries(CHEMICAL_OVERRIDES)) {
    const entry = {
      hebrew: info.hebrew,
      hebrew_niqqud: '',
      dictionary: info.dict || 'Chemical Override',
      genre: 'Chemistry',
      priority: 100,
      isOverride: true,
    };

    if (!wordDict.has(eng)) {
      added++;
    } else {
      overridden++;
    }
    wordDict.set(eng, entry);
  }

  console.log('  Added ' + added + ' new terms, overrode ' + overridden + ' existing');
}

function normalizeEnglishName(name) {
  return name
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, ' ')  // Strip parenthetical parts entirely
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Handle "ANION, ELEMENT" format (reversed comma-separated names)
function tryReversedCommaName(originalName, phraseDict, compoundPatterns, wordDict) {
  // Check if name has comma format like "ALGINATE, CALCIUM"
  var commaMatch = originalName.match(/^([A-Z][A-Z ]+),\s*([A-Z][A-Z ]+)$/i);
  if (!commaMatch) return null;

  var reversed = commaMatch[2].trim() + ' ' + commaMatch[1].trim();
  var normalized = reversed.toLowerCase();

  // Try compound patterns
  if (compoundPatterns[normalized]) {
    return {
      hebrew: compoundPatterns[normalized],
      source: 'compound_pattern',
      details: 'Verified compound pattern (reversed comma)',
    };
  }

  // Try as element+salt
  var words = normalized.split(/\s+/);
  if (words.length === 2) {
    var elem = wordDict.get(words[0]);
    var anion = wordDict.get(words[1]);
    if (elem && anion && elem.priority >= 70 && anion.priority >= 70) {
      return {
        hebrew: anion.hebrew + ' ' + elem.hebrew,
        source: 'element_salt',
        details: words[0] + '=' + elem.hebrew + ' [' + elem.dictionary + '], ' +
                 words[1] + '=' + anion.hebrew + ' [' + anion.dictionary + '] (reversed comma)',
      };
    }
  }

  return null;
}

function tryExactMatch(name, phraseDict, compoundPatterns) {
  const normalized = normalizeEnglishName(name);

  // Try compound patterns first (highest priority - manually verified)
  if (compoundPatterns[normalized]) {
    return {
      hebrew: compoundPatterns[normalized],
      source: 'compound_pattern',
      details: 'Verified compound pattern',
    };
  }

  // Check for academy corrections (known wrong matches we override)
  if (ACADEMY_CORRECTIONS[normalized]) {
    return {
      hebrew: ACADEMY_CORRECTIONS[normalized],
      source: 'academy_corrected',
      details: 'Academy corrected for food context',
    };
  }

  // Check if this exact match is blocklisted
  if (EXACT_MATCH_BLOCKLIST.has(normalized)) {
    return null;
  }

  // Try Academy phrase dictionary
  if (phraseDict.has(normalized)) {
    const entry = phraseDict.get(normalized);
    return {
      hebrew: entry.hebrew,
      source: 'academy_exact',
      details: 'Academy [' + entry.dictionary + ']',
    };
  }

  return null;
}

function tryAcidPattern(name) {
  const normalized = normalizeEnglishName(name);

  // Check for "X acid" pattern
  const acidMatch = normalized.match(/^(\w+)\s+acid$/);
  if (!acidMatch) return null;

  const adjective = acidMatch[1];

  // Check special of-construct acids first
  if (ACID_OF_CONSTRUCT[adjective]) {
    return {
      hebrew: ACID_OF_CONSTRUCT[adjective],
      source: 'acid_of_construct',
      details: 'Acid pattern: ' + adjective + ' -> ' + ACID_OF_CONSTRUCT[adjective],
    };
  }

  // Check adjective-form acids
  if (ACID_ADJECTIVE[adjective]) {
    return {
      hebrew: ACID_ADJECTIVE[adjective],
      source: 'acid_adjective',
      details: 'Acid pattern: ' + adjective + ' -> ' + ACID_ADJECTIVE[adjective],
    };
  }

  return null;
}

function tryElementSaltPattern(name, wordDict) {
  const normalized = normalizeEnglishName(name);
  const words = normalized.split(/\s+/);

  // Pattern: ELEMENT + SALT_ANION (e.g., "calcium carbonate", "sodium chloride")
  if (words.length === 2) {
    const element = wordDict.get(words[0]);
    const anion = wordDict.get(words[1]);

    if (element && anion) {
      // Known chemical elements
      const knownElements = new Set([
        'calcium', 'sodium', 'potassium', 'magnesium', 'iron', 'zinc',
        'copper', 'manganese', 'aluminum', 'aluminium', 'silicon',
        'titanium', 'chromium', 'selenium', 'cobalt', 'nickel',
        'barium', 'strontium', 'lithium', 'tin', 'boron',
        'silver', 'gold', 'molybdenum', 'carbon', 'hydrogen',
        'nitrogen', 'phosphorus', 'sulfur', 'sulphur', 'chlorine',
        'bromine', 'iodine',
      ]);

      // Known anions
      const knownAnions = new Set([
        'oxide', 'dioxide', 'monoxide', 'trioxide', 'peroxide',
        'hydroxide', 'chloride', 'bromide', 'iodide', 'fluoride',
        'sulfate', 'sulphate', 'sulfite', 'sulphite', 'sulfide', 'sulphide',
        'phosphate', 'phosphite', 'carbonate', 'bicarbonate',
        'nitrate', 'nitrite', 'acetate', 'citrate', 'lactate',
        'tartrate', 'benzoate', 'sorbate', 'propionate',
        'butyrate', 'formate', 'fumarate', 'malate', 'succinate',
        'glutamate', 'stearate', 'oleate', 'palmitate',
        'silicate', 'aluminate', 'caseinate', 'alginate',
        'gluconate', 'ascorbate',
      ]);

      // Also allow "ferrous"/"ferric" as element-like
      const elementLike = new Set([...knownElements, 'ferrous', 'ferric', 'ammonium']);

      if (elementLike.has(words[0]) && knownAnions.has(words[1])) {
        // Hebrew chemical naming: anion first, then element
        return {
          hebrew: anion.hebrew + ' ' + element.hebrew,
          source: 'element_salt',
          details: words[0] + '=' + element.hebrew + ' [' + element.dictionary + '], ' +
                   words[1] + '=' + anion.hebrew + ' [' + anion.dictionary + ']',
        };
      }
    }
  }

  return null;
}

// Exact matches from Academy that are WRONG for food context
// (Academy term means something different in our domain)
var EXACT_MATCH_BLOCKLIST = new Set([
  'bay',              // Academy: שדה (field), but food context: דפנה (bay leaf/laurel)
  'activated carbon', // Academy: פחם גז (gas carbon), should be פחם פעיל
  'base',             // Academy: בסיס (mathematical/engineering), ambiguous
  'culture',          // Academy: תרבות, but food context: תרבית (bacterial culture)
  'medium',           // Academy: אמצע/תווך, but food context: מצע (growth medium)
  'film',             // Academy: סרט, but food context: ציפוי
  'carrier',          // Academy: נושא (general), too generic
]);

// Academy corrections: overriding wrong Academy matches with correct food translations
var ACADEMY_CORRECTIONS = {
  'bay': 'דפנה',
  'activated carbon': 'פחם פעיל',
};

// Words that should NOT be part of compositions (too generic or misleading)
var COMPOSITION_BLOCKLIST = new Set([
  'bass', 'bay', 'bell', 'bill', 'bob', 'bone', 'book', 'box', 'branch',
  'bridge', 'can', 'cap', 'case', 'cast', 'cell', 'chain', 'chair',
  'court', 'cross', 'crown', 'cup', 'cut', 'dam', 'date', 'die', 'dock',
  'drum', 'ear', 'eye', 'face', 'fan', 'field', 'file', 'fire', 'flag',
  'flat', 'fly', 'fork', 'frame', 'gate', 'hand', 'head', 'heart',
  'hole', 'hook', 'horn', 'house', 'joint', 'key', 'knee', 'lamp',
  'lane', 'leg', 'line', 'lip', 'lock', 'log', 'mark', 'mat', 'mouth',
  'nail', 'neck', 'net', 'nose', 'note', 'page', 'pan', 'park', 'pass',
  'path', 'pipe', 'pit', 'plate', 'plug', 'point', 'pole', 'pool',
  'post', 'pot', 'press', 'pump', 'rack', 'rail', 'ring', 'rock',
  'rod', 'roll', 'roof', 'room', 'root', 'rope', 'row', 'run', 'saw',
  'seat', 'set', 'shaft', 'shell', 'ship', 'side', 'sign', 'skin',
  'slip', 'slot', 'spring', 'stage', 'stand', 'star', 'stem', 'step',
  'stock', 'stone', 'stop', 'strip', 'switch', 'table', 'tail', 'tank',
  'tap', 'tie', 'tip', 'top', 'track', 'train', 'trap', 'tree', 'tube',
  'turn', 'valve', 'wall', 'wave', 'web', 'wheel', 'wing', 'wire',
  'wood', 'work', 'zone',
  // Words whose Hebrew translation is ambiguous/domain-dependent:
  'base', 'bed', 'block', 'body', 'bridge', 'brush', 'coat',
]);

function tryWordByWordComposition(name, wordDict) {
  const normalized = normalizeEnglishName(name);
  const words = normalized.split(/\s+/);

  // Only try 2-word compositions (conservative)
  if (words.length !== 2) return null;

  // Skip common connectors
  const skipWords = new Set(['and', 'or', 'of', 'the', 'a', 'an', 'with', 'from', 'in', 'for', 'to', 'by']);
  if (words.some(function(w) { return skipWords.has(w); })) return null;

  // Skip if any word is very short
  if (words.some(function(w) { return w.length < 2; })) return null;

  // Skip blocklisted words
  if (words.some(function(w) { return COMPOSITION_BLOCKLIST.has(w); })) return null;

  const word1 = wordDict.get(words[0]);
  const word2 = wordDict.get(words[1]);

  if (!word1 || !word2) return null;

  // Only compose if both words are from chemistry/food contexts (priority >= 50)
  if (word1.priority < 50 || word2.priority < 50) return null;

  // For "qualifier + noun" patterns in English, Hebrew reverses to "noun qualifier"
  // This works for:
  //   "almond extract" -> "תמצית שקד" (extract almond)
  //   "black pepper" -> "פלפל שחור" (pepper black)
  //   "ethyl acetate" -> "אצטט אתיל" (acetate ethyl)
  return {
    hebrew: word2.hebrew + ' ' + word1.hebrew,
    source: 'word_composition',
    details: words[0] + '=' + word1.hebrew + ' [' + word1.dictionary + '], ' +
             words[1] + '=' + word2.hebrew + ' [' + word2.dictionary + ']',
  };
}

function escapeSQL(str) {
  return str.replace(/'/g, "''");
}

function shouldSkipName(name) {
  // Skip names that are clearly not translatable
  if (/^\(\+\/\-\)/.test(name)) return true;  // Stereochemistry notation
  if (/^\([\dA-Z]/.test(name)) return true;    // Complex IUPAC notation
  if (/\d{4,}/.test(name)) return true;        // Has 4+ digit numbers (CAS-like)
  if (name.length > 100) return true;           // Very long names are likely IUPAC
  if (/^[0-9]/.test(name)) return true;        // Starts with number
  return false;
}

// Strip parenthetical qualifiers from name for matching
// e.g. "Calcium Sulfate (Food-Grade)" -> "Calcium Sulfate"
// e.g. "Alginic acid (dental impressions/food-safe)" -> "Alginic acid"
function stripParenthetical(name) {
  return name.replace(/\s*\([^)]*\)\s*$/g, '').trim();
}

function generateTranslations(missingNames, phraseDict, wordDict) {
  console.log('\nProcessing ' + missingNames.length + ' missing names...');

  const results = [];
  const stats = {
    total: missingNames.length,
    skipped: 0,
    compoundPattern: 0,
    academyExact: 0,
    acidPattern: 0,
    elementSalt: 0,
    wordComposition: 0,
    noMatch: 0,
  };

  for (const name of missingNames) {
    if (shouldSkipName(name)) {
      stats.skipped++;
      continue;
    }

    let result = null;

    // Try with original name first, then with parenthetical stripped
    var namesToTry = [name];
    var stripped = stripParenthetical(name);
    if (stripped !== name && stripped.length > 2) {
      namesToTry.push(stripped);
    }

    var matched = false;
    for (var ni = 0; ni < namesToTry.length; ni++) {
      var tryName = namesToTry[ni];

      // Strategy 1: Exact match (compound patterns + Academy phrases)
      result = tryExactMatch(tryName, phraseDict, COMPOUND_PATTERNS);
      if (result) {
        if (result.source === 'compound_pattern') stats.compoundPattern++;
        else stats.academyExact++;
        results.push({ name: name, hebrew: result.hebrew, source: result.source, details: result.details });
        matched = true;
        break;
      }

      // Strategy 1.5: Reversed comma names
      result = tryReversedCommaName(tryName, phraseDict, COMPOUND_PATTERNS, wordDict);
      if (result) {
        if (result.source === 'compound_pattern') stats.compoundPattern++;
        else stats.elementSalt++;
        results.push({ name: name, hebrew: result.hebrew, source: result.source, details: result.details });
        matched = true;
        break;
      }

      // Strategy 2: Acid pattern
      result = tryAcidPattern(tryName);
      if (result) {
        stats.acidPattern++;
        results.push({ name: name, hebrew: result.hebrew, source: result.source, details: result.details });
        matched = true;
        break;
      }

      // Strategy 3: Element + salt pattern
      result = tryElementSaltPattern(tryName, wordDict);
      if (result) {
        stats.elementSalt++;
        results.push({ name: name, hebrew: result.hebrew, source: result.source, details: result.details });
        matched = true;
        break;
      }

      // Strategy 4: Word-by-word composition (conservative)
      result = tryWordByWordComposition(tryName, wordDict);
      if (result) {
        stats.wordComposition++;
        results.push({ name: name, hebrew: result.hebrew, source: result.source, details: result.details });
        matched = true;
        break;
      }
    }

    if (matched) continue;

    stats.noMatch++;
  }

  return { results: results, stats: stats };
}

function generateSQL(results, outputPath) {
  console.log('\nGenerating SQL to ' + outputPath + '...');

  const lines = [];
  lines.push('-- ============================================================================');
  lines.push('-- Academy Compound Translations for food_additives');
  lines.push('-- Generated: ' + new Date().toISOString().split('T')[0]);
  lines.push('-- Source: Hebrew Academy vocabulary + chemical naming rules');
  lines.push('-- Strategy: Word-level dictionary + compound composition');
  lines.push('-- ============================================================================');
  lines.push('');

  // Group by source type
  const bySource = {};
  for (var i = 0; i < results.length; i++) {
    var r = results[i];
    if (!bySource[r.source]) bySource[r.source] = [];
    bySource[r.source].push(r);
  }

  var sourceOrder = [
    ['compound_pattern', 'Verified Compound Patterns (manually verified chemical names)'],
    ['academy_corrected', 'Academy Matches (corrected for food context)'],
    ['academy_exact', 'Exact Academy Matches'],
    ['acid_of_construct', 'Acid Names (of-construct pattern)'],
    ['acid_adjective', 'Acid Names (adjective pattern)'],
    ['element_salt', 'Element + Salt Compositions'],
    ['word_composition', 'Word-by-Word Compositions'],
  ];

  for (var s = 0; s < sourceOrder.length; s++) {
    var source = sourceOrder[s][0];
    var label = sourceOrder[s][1];
    var items = bySource[source];
    if (!items || items.length === 0) continue;

    lines.push('-- ============================================================================');
    lines.push('-- ' + label + ' (' + items.length + ' entries)');
    lines.push('-- ============================================================================');
    lines.push('');

    for (var j = 0; j < items.length; j++) {
      var item = items[j];
      var escapedName = escapeSQL(item.name);
      var escapedHebrew = escapeSQL(item.hebrew);
      lines.push('-- ' + item.name + ' -> ' + item.hebrew + ' (' + item.details + ')');
      lines.push("UPDATE food_additives SET hebrew_name = '" + escapedHebrew +
                  "' WHERE common_name = '" + escapedName +
                  "' AND (hebrew_name IS NULL OR LENGTH(hebrew_name) = 0);");
      lines.push('');
    }
  }

  // Ensure output directory exists
  var dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
  console.log('  Wrote ' + results.length + ' UPDATE statements');
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('=== Academy Compound Matcher ===\n');

  // Step 1: Parse Academy SQL
  var terms = parseAcademySQL(ACADEMY_SQL_PATH);

  // Step 2: Build dictionaries
  var dicts = buildWordDictionary(terms);
  var phraseDict = dicts.phraseDict;
  var wordDict = dicts.wordDict;
  var categoryMap = dicts.categoryMap;

  // Step 3: Add chemical overrides
  addChemicalOverrides(wordDict);

  // Step 4: Load missing names
  console.log('\nLoading missing names from ' + MISSING_NAMES_PATH + '...');
  var missingNames = JSON.parse(fs.readFileSync(MISSING_NAMES_PATH, 'utf8'));
  console.log('  Loaded ' + missingNames.length + ' missing names');

  // Step 5: Generate translations
  var gen = generateTranslations(missingNames, phraseDict, wordDict);
  var results = gen.results;
  var stats = gen.stats;

  // Step 6: Output SQL
  generateSQL(results, OUTPUT_SQL_PATH);

  // Step 7: Print statistics
  console.log('\n=== STATISTICS ===');
  console.log('Total missing names:     ' + stats.total);
  console.log('Skipped (untranslatable):' + stats.skipped);
  console.log('Compound patterns:       ' + stats.compoundPattern);
  console.log('Academy exact matches:   ' + stats.academyExact);
  console.log('Acid patterns:           ' + stats.acidPattern);
  console.log('Element + salt:          ' + stats.elementSalt);
  console.log('Word compositions:       ' + stats.wordComposition);
  console.log('No match:                ' + stats.noMatch);
  console.log('---');
  console.log('Total translated:        ' + results.length + ' (' + (results.length / stats.total * 100).toFixed(1) + '%)');

  // Print sample translations
  console.log('\n=== SAMPLE TRANSLATIONS ===');
  var sampleCount = Math.min(40, results.length);
  for (var i = 0; i < sampleCount; i++) {
    console.log('  ' + results[i].name + ' -> ' + results[i].hebrew + ' [' + results[i].source + ']');
  }

  if (results.length > sampleCount) {
    console.log('  ... and ' + (results.length - sampleCount) + ' more');
  }

  console.log('\nSQL written to: ' + OUTPUT_SQL_PATH);
}

main();
