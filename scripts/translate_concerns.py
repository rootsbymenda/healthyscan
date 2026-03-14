#!/usr/bin/env python3
"""
Translate health_concerns from English to Hebrew for food_additives table.
Generates SQL UPDATE statements for D1.
"""
import json
import re

# Load all unique concerns
with open("C:/BENDA_PROJECT/HEALTHYSCAN/scripts/all_concerns.json", encoding="utf-8") as f:
    concerns = json.load(f)

# ============================================================
# TRANSLATION DICTIONARY — exact matches
# ============================================================
EXACT = {
    # === SAFE / NO CONCERN ===
    "Generally safe": "בטוח בדרך כלל",
    "Safe": "בטוח",
    "No significant concerns": "ללא חששות משמעותיים",
    "No safety concern": "ללא חשש בטיחותי",
    "No safety concern (EFSA 2017)": "ללא חשש בטיחותי (EFSA 2017)",
    "No significant concerns at ADI": "ללא חששות משמעותיים בצריכה יומית מותרת",
    "No concerns": "ללא חששות",
    "Generally recognized as safe": "מוכר כבטוח בדרך כלל (GRAS)",
    "Generally well-tolerated": "נסבל היטב בדרך כלל",
    "Safe at food levels": "בטוח ברמות מזון רגילות",
    "Safe at ADI": "בטוח בצריכה יומית מותרת",
    "New; considered safe": "חדש; נחשב בטוח",
    "Essential mineral, generally safe": "מינרל חיוני, בטוח בדרך כלל",
    "Generally safe in processing": "בטוח בדרך כלל בעיבוד",
    "Generally safe at low levels": "בטוח בדרך כלל ברמות נמוכות",
    "Considered safe": "נחשב בטוח",
    "Safe in traditional use": "בטוח בשימוש מסורתי",
    "Safe; traditional use": "בטוח; שימוש מסורתי",
    "Safe; antioxidant": "בטוח; נוגד חמצון",
    "Safe. Allergen: milk.": "בטוח. אלרגן: חלב.",
    "Safe as feed additive": "בטוח כתוסף מזון לבעלי חיים",

    # === LIMITED DATA ===
    "Limited data": "מידע מוגבל",
    "Insufficient data": "נתונים לא מספיקים",
    "Insufficient safety data": "נתוני בטיחות לא מספיקים",
    "Limited safety data": "נתוני בטיחות מוגבלים",
    "Very limited data": "מידע מוגבל מאוד",
    "Limited research": "מחקר מוגבל",
    "Limited studies": "מחקרים מוגבלים",

    # === ALLERGENS ===
    "Allergic reactions": "תגובות אלרגיות",
    "Allergic reactions possible": "תגובות אלרגיות אפשריות",
    "Allergic reactions in sensitive individuals": "תגובות אלרגיות באנשים רגישים",
    "Allergic reactions, limited data": "תגובות אלרגיות, מידע מוגבל",
    "Allergic reactions, less used": "תגובות אלרגיות, פחות בשימוש",
    "Allergic reactions, hormone disruption concerns": "תגובות אלרגיות, חשש לשיבוש הורמונלי",
    "Allergic reactions including anaphylaxis": "תגובות אלרגיות כולל אנפילקסיס",
    "Allergen risk if soy/egg-derived": "סיכון אלרגני אם מופק מסויה/ביצים",
    "Rare allergic reactions": "תגובות אלרגיות נדירות",
    "Asthma triggers": "עלול לעורר אסטמה",
    "Asthma triggers, urticaria in sensitive individuals": "עלול לעורר אסטמה, אורטיקריה באנשים רגישים",
    "Asthma triggers, allergic reactions": "עלול לעורר אסטמה, תגובות אלרגיות",
    "Asthma triggers in sensitive individuals": "עלול לעורר אסטמה באנשים רגישים",

    # === GI / DIGESTIVE ===
    "GI discomfort": "אי נוחות במערכת העיכול",
    "GI effects at high doses": "תופעות במערכת העיכול במינונים גבוהים",
    "Bloating, gas, diarrhea at high doses": "נפיחות, גזים, שלשול במינונים גבוהים",
    "Laxative effect at high doses": "השפעה משלשלת במינונים גבוהים",
    "Laxative effect": "השפעה משלשלת",
    "Laxative effects at high intake": "השפעה משלשלת בצריכה גבוהה",
    "Digestive discomfort at high doses": "אי נוחות בעיכול במינונים גבוהים",
    "Flatulence at high doses": "גזים במינונים גבוהים",
    "Gut microbiome concerns": "חששות לגבי מיקרוביום המעי",
    "Gut microbiome concerns in studies": "חששות לגבי מיקרוביום המעי במחקרים",
    "Gut microbiome concerns in animal studies": "חששות לגבי מיקרוביום המעי במחקרי בעלי חיים",
    "Gut microbiome disruption in animal studies": "שיבוש מיקרוביום המעי במחקרי בעלי חיים",

    # === CANCER / CARCINOGEN ===
    "Carcinogenicity; genotoxicity": "סרטוגניות; רעילות גנטית",
    "Potential carcinogen": "חשד לחומר מסרטן",
    "Possible carcinogen": "חשד לחומר מסרטן",
    "Skin irritant, potential carcinogen": "מגרה עור, חשד לחומר מסרטן",
    "Carcinogenic": "מסרטן",
    "IARC Group 2B carcinogen": "מסרטן קבוצה 2B לפי IARC",
    "IARC Group 2A carcinogen": "מסרטן קבוצה 2A לפי IARC",

    # === ENDOCRINE / HORMONAL ===
    "Endocrine disruption concerns": "חשש לשיבוש הורמונלי",
    "Endocrine disruption, reproductive concerns": "שיבוש הורמונלי, חששות לפוריות",
    "Endocrine disruption concerns, allergic reactions": "חשש לשיבוש הורמונלי, תגובות אלרגיות",
    "Hormone disruptor concerns": "חשש לשיבוש הורמונלי",

    # === BANNED / NOT APPROVED ===
    "Not approved for food": "לא מאושר למזון",
    "Not for food": "לא למזון",
    "Not approved for food use in EU": "לא מאושר למזון באיחוד האירופי",
    "Not approved in EU": "לא מאושר באיחוד האירופי",
    "Banned in EU": "אסור באיחוד האירופי",
    "Banned in several countries": "אסור במספר מדינות",
    "Not permitted in Israel": "לא מותר בישראל",
    "EU removed from approved list": "הוסר מרשימת המאושרים באיחוד האירופי",

    # === PHOSPHATE ===
    "High phosphate intake concern": "חשש מצריכת פוספט גבוהה",
    "Same group phosphate concerns": "חששות פוספט מאותה קבוצה",
    "Phosphate load": "עומס פוספט",
    "Phosphate concerns": "חששות פוספט",

    # === ALUMINIUM ===
    "Aluminium accumulation concerns": "חשש מהצטברות אלומיניום",
    "Aluminium concerns": "חששות אלומיניום",
    "Aluminium exposure concern": "חשש מחשיפה לאלומיניום",
    "Aluminium exposure consideration": "שיקולי חשיפה לאלומיניום",
    "Aluminum exposure concerns": "חשש מחשיפה לאלומיניום",
    "Aluminium accumulation; neurotoxicity debated": "הצטברות אלומיניום; רעילות עצבית שנויה במחלוקת",

    # === HYPERACTIVITY ===
    "Hyperactivity in children (Southampton study)": "היפראקטיביות בילדים (מחקר סאות'המפטון)",
    "Hyperactivity concerns in children": "חשש להיפראקטיביות בילדים",
    "Linked to hyperactivity in children": "קשור להיפראקטיביות בילדים",

    # === GENERALLY SAFE + COMPOUND ===
    "Generally safe, anthocyanins": "בטוח בדרך כלל, אנתוציאנינים",
    "Generally safe, carotenoid": "בטוח בדרך כלל, קרוטנואיד",
    "Generally safe, enzyme": "בטוח בדרך כלל, אנזים",
    "Generally safe, polyphenols": "בטוח בדרך כלל, פוליפנולים",
    "Generally safe, polyphenol": "בטוח בדרך כלל, פוליפנול",
    "Generally safe, B vitamin": "בטוח בדרך כלל, ויטמין B",
    "Generally safe, tannins": "בטוח בדרך כלל, טאנינים",
    "Generally safe, polysaccharides": "בטוח בדרך כלל, פוליסכרידים",
    "Generally safe, isothiocyanates": "בטוח בדרך כלל, איזותיוציאנטים",
    "Generally safe, glucosinolates": "בטוח בדרך כלל, גלוקוזינולטים",
    "Generally safe, capsaicin": "בטוח בדרך כלל, קפסאיצין",
    "Generally safe, betalains": "בטוח בדרך כלל, בטלאינים",
    "Generally safe, plant sterol": "בטוח בדרך כלל, סטרול צמחי",
    "Generally safe, high sodium": "בטוח בדרך כלל, נתרן גבוה",
    "Generally safe, eugenol": "בטוח בדרך כלל, אאוגנול",
    "Generally safe, contains alcohol": "בטוח בדרך כלל, מכיל אלכוהול",
    "Generally safe, beta-carotene": "בטוח בדרך כלל, בטא-קרוטן",
    "Generally safe, anthocyanidin": "בטוח בדרך כלל, אנתוציאנידין",
    "Generally safe, amino acid derivative": "בטוח בדרך כלל, נגזרת חומצת אמינו",
    "Generally safe, amino acid": "בטוח בדרך כלל, חומצת אמינו",
    "Generally safe, flavonoid": "בטוח בדרך כלל, פלבונואיד",
    "Generally safe, organic acid": "בטוח בדרך כלל, חומצה אורגנית",
    "Generally safe, terpenoid": "בטוח בדרך כלל, טרפנואיד",
    "Generally safe, sulfur compound": "בטוח בדרך כלל, תרכובת גופרית",
    "Generally safe, catechin": "בטוח בדרך כלל, קטכין",
    "Generally safe, curcuminoid": "בטוח בדרך כלל, כורכומינואיד",
    "Generally safe, lignan": "בטוח בדרך כלל, ליגנן",
    "Generally safe, stilbene": "בטוח בדרך כלל, סטילבן",
    "Generally safe, phytosterol": "בטוח בדרך כלל, פיטוסטרול",
    "Generally safe, alkaloid": "בטוח בדרך כלל, אלקלואיד",
    "Generally safe, carotene": "בטוח בדרך כלל, קרוטן",
    "Generally safe, xanthophyll": "בטוח בדרך כלל, קסנתופיל",
    "Generally safe, phenolic acid": "בטוח בדרך כלל, חומצה פנולית",
    "Generally safe, fiber": "בטוח בדרך כלל, סיב תזונתי",
    "Generally safe, essential oil component": "בטוח בדרך כלל, רכיב שמן אתרי",
    "Generally safe, prebiotic fiber": "בטוח בדרך כלל, סיב פרה-ביוטי",
    "Generally safe, prebiotic": "בטוח בדרך כלל, פרה-ביוטי",

    # === VITAMINS / MINERALS ===
    "See Vitamin E": "ראה ויטמין E",
    "See Vitamin A": "ראה ויטמין A",
    "See Vitamin D": "ראה ויטמין D",
    "See Vitamin K": "ראה ויטמין K",
    "See Vitamin B1": "ראה ויטמין B1",
    "See Vitamin B5": "ראה ויטמין B5",
    "See Vitamin B6": "ראה ויטמין B6",
    "See Vitamin B12": "ראה ויטמין B12",
    "See Zinc": "ראה אבץ",
    "See Calcium": "ראה סידן",
    "See Magnesium": "ראה מגנזיום",
    "See Iron": "ראה ברזל",
    "See Iodine": "ראה יוד",
    "See Selenium": "ראה סלניום",
    "See Copper": "ראה נחושת",
    "See Manganese": "ראה מנגן",
    "See Potassium": "ראה אשלגן",
    "Vitamin E, generally safe": "ויטמין E, בטוח בדרך כלל",
    "Vitamin E form, generally safe": "צורת ויטמין E, בטוח בדרך כלל",
    "Vitamin C salt, generally safe": "מלח ויטמין C, בטוח בדרך כלל",

    # === 4-MEI ===
    "4-MEI and THI concerns; California Prop 65": "חשש מ-4-MEI ו-THI; רשימת Prop 65 קליפורניה",
    "4-MEI concerns for Class III/IV": "חשש מ-4-MEI בסוג III/IV",
    "4-MEI monitoring; safe at typical beer levels": "ניטור 4-MEI; בטוח ברמות בירה רגילות",
    "4-methylimidazole (4-MEI) concerns; California Prop 65 listed": "חשש מ-4-מתילאימידזול (4-MEI); רשום ב-Prop 65 קליפורניה",
    "4-methylimidazole (4-MEI) contaminant concerns; potential carcinogen": "חשש ממזהם 4-מתילאימידזול (4-MEI); חשד לחומר מסרטן",

    # === GMO ===
    "No safety concern (EFSA 2017); potential GMO": "ללא חשש בטיחותי (EFSA 2017); אפשרות ל-GMO",
    "No safety concern; potential GMO": "ללא חשש בטיחותי; אפשרות ל-GMO",
    "Potential GMO source": "מקור GMO אפשרי",

    # === E-NUMBER REFERENCES ===
    "See E132": "ראה E132",
    "See E120": "ראה E120",
    "See E160c": "ראה E160c",

    # === COMMON FOOD DESCRIPTIONS ===
    "Lean protein source": "מקור חלבון דל שומן",
    "High sodium": "נתרן גבוה",
    "High in sodium": "עשיר בנתרן",
    "High caloric value": "ערך קלורי גבוה",
    "High in saturated fat": "עשיר בשומן רווי",
    "Contains caffeine": "מכיל קפאין",
    "Contains alcohol": "מכיל אלכוהול",
    "Contains gluten": "מכיל גלוטן",
    "Dairy allergen": "אלרגן חלב",
    "Soy allergen": "אלרגן סויה",
    "Nut allergen": "אלרגן אגוזים",
    "Tree nut allergen": "אלרגן אגוזי עץ",

    # === PURINE / GOUT ===
    "Purine content; gout risk": "תכולת פורין; סיכון לגאוט",

    # === SIMILAR CONCERNS ===
    "Similar concerns as other polysorbates": "חששות דומים לפוליסורבטים אחרים",
    "No significant concerns; prebiotic": "ללא חששות משמעותיים; פרה-ביוטי",

    # === MISC COMMON ===
    "Antioxidant properties; generally well tolerated": "תכונות נוגדות חמצון; נסבל היטב בדרך כלל",
    "Natural flavor compound": "תרכובת טעם טבעית",
    "Natural flavoring": "תיבול טבעי",
    "Natural preservative": "משמר טבעי",
    "Not commonly used in food": "לא נפוץ בשימוש במזון",
    "Traditional spice, generally safe": "תבלין מסורתי, בטוח בדרך כלל",
    "Mineral supplement": "תוסף מינרלי",
}

# ============================================================
# PATTERN-BASED TRANSLATIONS
# ============================================================
def translate_by_pattern(text):
    """Attempt translation via pattern matching."""

    t = text.strip()

    # "Generally safe, X" pattern
    m = re.match(r'^Generally safe,\s+(.+)$', t)
    if m:
        compound = m.group(1)
        return f"בטוח בדרך כלל, {compound}"

    # "See X" pattern
    m = re.match(r'^See\s+(.+)$', t)
    if m:
        return f"ראה {m.group(1)}"

    # "X, generally safe" pattern
    m = re.match(r'^(.+),\s+generally safe$', t)
    if m:
        return f"{m.group(1)}, בטוח בדרך כלל"

    # "No safety concern" variants
    if t.startswith("No safety concern"):
        rest = t[len("No safety concern"):]
        return f"ללא חשש בטיחותי{rest}"

    # "No significant concerns" variants
    if t.startswith("No significant concerns"):
        rest = t[len("No significant concerns"):]
        return f"ללא חששות משמעותיים{rest}"

    # "Generally safe" as prefix
    if t.startswith("Generally safe"):
        rest = t[len("Generally safe"):]
        return f"בטוח בדרך כלל{rest}"

    return None

# ============================================================
# WORD/PHRASE REPLACEMENT DICTIONARY for remaining texts
# ============================================================
WORD_MAP = {
    "Generally safe": "בטוח בדרך כלל",
    "generally safe": "בטוח בדרך כלל",
    "Generally recognized as safe": "מוכר כבטוח בדרך כלל",
    "No significant concerns": "ללא חששות משמעותיים",
    "No safety concern": "ללא חשש בטיחותי",
    "No concerns": "ללא חששות",
    "Safe": "בטוח",
    "safe": "בטוח",
    "Allergic reactions": "תגובות אלרגיות",
    "allergic reactions": "תגובות אלרגיות",
    "Allergen": "אלרגן",
    "allergen": "אלרגן",
    "Asthma": "אסטמה",
    "asthma": "אסטמה",
    "Carcinogenic": "מסרטן",
    "carcinogenic": "מסרטן",
    "carcinogen": "חומר מסרטן",
    "Carcinogenicity": "סרטוגניות",
    "Genotoxicity": "רעילות גנטית",
    "genotoxicity": "רעילות גנטית",
    "Genotoxic": "רעיל גנטית",
    "genotoxic": "רעיל גנטית",
    "Endocrine disruption": "שיבוש הורמונלי",
    "endocrine disruption": "שיבוש הורמונלי",
    "Endocrine disruptor": "משבש הורמונלי",
    "Hormone disruption": "שיבוש הורמונלי",
    "hormone disruption": "שיבוש הורמונלי",
    "Hyperactivity": "היפראקטיביות",
    "hyperactivity": "היפראקטיביות",
    "Neurotoxicity": "רעילות עצבית",
    "neurotoxicity": "רעילות עצבית",
    "Hepatotoxicity": "רעילות כבדית",
    "hepatotoxicity": "רעילות כבדית",
    "Nephrotoxicity": "רעילות כלייתית",
    "nephrotoxicity": "רעילות כלייתית",
    "Cytotoxicity": "רעילות תאית",
    "Reproductive toxicity": "רעילות לפוריות",
    "reproductive toxicity": "רעילות לפוריות",
    "reproductive concerns": "חששות לפוריות",
    "Developmental toxicity": "רעילות התפתחותית",
    "Banned": "אסור",
    "banned": "אסור",
    "Not approved": "לא מאושר",
    "Not permitted": "לא מותר",
    "Limited data": "מידע מוגבל",
    "limited data": "מידע מוגבל",
    "Insufficient data": "נתונים לא מספיקים",
    "insufficient data": "נתונים לא מספיקים",
    "potential": "פוטנציאלי",
    "Potential": "פוטנציאלי",
    "concerns": "חששות",
    "concern": "חשש",
    "in sensitive individuals": "באנשים רגישים",
    "in children": "בילדים",
    "at high doses": "במינונים גבוהים",
    "at high intake": "בצריכה גבוהה",
    "at excessive intake": "בצריכה מוגזמת",
    "animal studies": "מחקרי בעלי חיים",
    "Animal studies": "מחקרי בעלי חיים",
    "in animal studies": "במחקרי בעלי חיים",
    "California Prop 65": "Prop 65 קליפורניה",
    "diarrhea": "שלשול",
    "nausea": "בחילה",
    "vomiting": "הקאות",
    "headache": "כאב ראש",
    "liver damage": "נזק לכבד",
    "kidney damage": "נזק לכליות",
    "thyroid": "בלוטת התריס",
    "blood pressure": "לחץ דם",
    "hypertension": "יתר לחץ דם",
    "diabetes": "סוכרת",
    "obesity": "השמנה",
    "inflammation": "דלקת",
    "oxidative stress": "עקה חמצונית",
    "DNA damage": "נזק ל-DNA",
    "skin irritation": "גירוי עור",
    "respiratory": "נשימתי",
    "cardiovascular": "לב וכלי דם",
    "pregnancy": "הריון",
    "fertility": "פוריות",
    "immune": "חיסוני",
    "tumor": "גידול",
    "tumors": "גידולים",
    "cancer": "סרטן",
    "antioxidant": "נוגד חמצון",
    "Antioxidant": "נוגד חמצון",
    "prebiotic": "פרה-ביוטי",
    "probiotic": "פרו-ביוטי",
    "preservative": "משמר",
    "sweetener": "ממתיק",
    "artificial": "מלאכותי",
    "natural": "טבעי",
    "Natural": "טבעי",
    "synthetic": "סינתטי",
    "Synthetic": "סינתטי",
    "organic": "אורגני",
    "GMO": "GMO",
    "mineral": "מינרל",
    "vitamin": "ויטמין",
    "protein": "חלבון",
    "fiber": "סיב תזונתי",
    "fat": "שומן",
    "sugar": "סוכר",
    "sodium": "נתרן",
    "cholesterol": "כולסטרול",
    "caloric": "קלורי",
    "calories": "קלוריות",
}

# ============================================================
# TRANSLATE FUNCTION
# ============================================================
def translate(text):
    """Translate a health_concerns text to Hebrew."""
    if not text or len(text.strip()) == 0:
        return ""

    t = text.strip()

    # 1. Try exact match
    if t in EXACT:
        return EXACT[t]

    # 2. Try pattern match
    pattern_result = translate_by_pattern(t)
    if pattern_result:
        return pattern_result

    # 3. Return None for manual/AI translation later
    return None

# ============================================================
# MAIN: Generate translations and SQL
# ============================================================
translated = {}
untranslated = []

for c in concerns:
    result = translate(c)
    if result is not None:
        translated[c] = result
    else:
        untranslated.append(c)

print(f"Translated: {len(translated)} / {len(concerns)}")
print(f"Untranslated: {len(untranslated)}")

# Save untranslated for review
with open("C:/BENDA_PROJECT/HEALTHYSCAN/scripts/untranslated_concerns.json", "w", encoding="utf-8") as f:
    json.dump(untranslated, f, ensure_ascii=False, indent=2)

# Generate SQL for translated ones
def escape_sql(s):
    return s.replace("'", "''")

sql_lines = []
for en, he in translated.items():
    sql_lines.append(
        f"UPDATE food_additives SET health_concerns_he = '{escape_sql(he)}' WHERE health_concerns = '{escape_sql(en)}';"
    )

# Write SQL file
with open("C:/BENDA_PROJECT/HEALTHYSCAN/scripts/sql/health_concerns_he_batch1.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines))

print(f"\nSQL file written: {len(sql_lines)} UPDATE statements")
print(f"Untranslated saved to: untranslated_concerns.json")

# Show sample untranslated
print(f"\nSample untranslated (first 20):")
for u in untranslated[:20]:
    print(f"  - {u}")
