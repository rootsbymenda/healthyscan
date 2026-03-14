#!/usr/bin/env python3
"""Translate ALL remaining health_concerns using pattern-based approach + direct translations."""
import json
import re

with open("C:/BENDA_PROJECT/HEALTHYSCAN/scripts/still_untranslated.json", encoding="utf-8") as f:
    concerns = json.load(f)

# ============================================================
# COMPREHENSIVE WORD/PHRASE MAP for automated translation
# ============================================================
PHRASE_MAP = [
    # Order matters — longer phrases first
    ("Generally safe", "בטוח בדרך כלל"),
    ("generally safe", "בטוח בדרך כלל"),
    ("Generally well-tolerated", "נסבל היטב בדרך כלל"),
    ("generally well-tolerated", "נסבל היטב בדרך כלל"),
    ("Generally well tolerated", "נסבל היטב בדרך כלל"),
    ("generally well tolerated", "נסבל היטב בדרך כלל"),
    ("Generally recognized as safe", "מוכר כבטוח בדרך כלל"),
    ("No significant concerns", "ללא חששות משמעותיים"),
    ("No safety concern", "ללא חשש בטיחותי"),
    ("No concerns", "ללא חששות"),
    ("not food-approved", "לא מאושר למזון"),
    ("not commercially available", "לא זמין מסחרית"),
    ("not commercially viable", "לא כדאי מסחרית"),
    ("not approved in EU", "לא מאושר באיחוד האירופי"),
    ("Not approved", "לא מאושר"),
    ("not approved", "לא מאושר"),
    ("Not permitted", "לא מותר"),
    ("Banned in EU", "אסור באיחוד האירופי"),
    ("Banned in US", "אסור בארה\"ב"),
    ("Banned EU", "אסור באיחוד האירופי"),
    ("Banned", "אסור"),

    # GI
    ("GI discomfort", "אי נוחות במערכת העיכול"),
    ("GI distress", "מצוקה במערכת העיכול"),
    ("GI upset", "הפרעה במערכת העיכול"),
    ("GI inflammation", "דלקת במערכת העיכול"),
    ("GI irritation", "גירוי במערכת העיכול"),
    ("GI toxicity", "רעילות במערכת העיכול"),
    ("GI concerns", "חששות במערכת העיכול"),
    ("GI effects", "תופעות במערכת העיכול"),
    ("GI cramping", "התכווצויות במערכת העיכול"),
    ("GI tract", "מערכת העיכול"),
    ("GI reference", "מדד גליקמי ייחוס"),

    # Carcinogenicity
    ("Carcinogenicity", "סרטוגניות"),
    ("carcinogenicity", "סרטוגניות"),
    ("Carcinogenic", "מסרטן"),
    ("carcinogenic", "מסרטן"),
    ("carcinogen", "חומר מסרטן"),
    ("potential carcinogen", "חשד לחומר מסרטן"),

    # Toxicity types
    ("Hepatotoxicity", "רעילות כבדית"),
    ("hepatotoxicity", "רעילות כבדית"),
    ("Nephrotoxicity", "רעילות כלייתית"),
    ("nephrotoxicity", "רעילות כלייתית"),
    ("Neurotoxicity", "רעילות עצבית"),
    ("neurotoxicity", "רעילות עצבית"),
    ("Cytotoxicity", "רעילות תאית"),
    ("cytotoxicity", "רעילות תאית"),
    ("Immunotoxicity", "רעילות חיסונית"),
    ("immunotoxicity", "רעילות חיסונית"),
    ("Genotoxicity", "רעילות גנטית"),
    ("genotoxicity", "רעילות גנטית"),
    ("Genotoxic", "רעיל גנטית"),
    ("genotoxic", "רעיל גנטית"),
    ("Mutagenicity", "מוטגניות"),
    ("mutagenicity", "מוטגניות"),
    ("Teratogenicity", "טרטוגניות"),
    ("teratogenicity", "טרטוגניות"),
    ("Reproductive toxicity", "רעילות לפוריות"),
    ("reproductive toxicity", "רעילות לפוריות"),
    ("reproductive/developmental toxicity", "רעילות לפוריות/התפתחותית"),
    ("Developmental toxicity", "רעילות התפתחותית"),
    ("developmental toxicity", "רעילות התפתחותית"),
    ("Cardiotoxicity", "רעילות לבבית"),
    ("cardiotoxicity", "רעילות לבבית"),
    ("hematotoxicity", "רעילות המטולוגית"),
    ("Immunosuppression", "דיכוי חיסוני"),
    ("immunosuppression", "דיכוי חיסוני"),

    # Endocrine
    ("Endocrine disruption", "שיבוש הורמונלי"),
    ("endocrine disruption", "שיבוש הורמונלי"),
    ("Estrogenic effects", "השפעות אסטרוגניות"),
    ("estrogenic effects", "השפעות אסטרוגניות"),
    ("Estrogenic/endocrine disruption", "שיבוש אסטרוגני/הורמונלי"),
    ("thyroid effects", "השפעה על בלוטת התריס"),
    ("thyroid function", "תפקוד בלוטת התריס"),
    ("thyroid", "בלוטת התריס"),
    ("hormone disruption", "שיבוש הורמונלי"),

    # Body systems
    ("cardiovascular disease", "מחלות לב וכלי דם"),
    ("cardiovascular effects", "השפעות על לב וכלי דם"),
    ("cardiovascular", "לב וכלי דם"),
    ("Cardiovascular stimulation", "גירוי לב וכלי דם"),
    ("CNS depression", "דיכוי מערכת העצבים המרכזית"),
    ("neurodevelopmental effects", "השפעות נוירו-התפתחותיות"),

    # Symptoms
    ("Allergic reactions", "תגובות אלרגיות"),
    ("allergic reactions", "תגובות אלרגיות"),
    ("allergic reaction", "תגובה אלרגית"),
    ("anaphylaxis", "אנפילקסיס"),
    ("anaphylactoid reactions", "תגובות אנפילקטואידיות"),
    ("Asthma", "אסטמה"),
    ("asthma", "אסטמה"),
    ("Hyperactivity", "היפראקטיביות"),
    ("hyperactivity", "היפראקטיביות"),
    ("hypertension", "יתר לחץ דם"),
    ("Hypertension", "יתר לחץ דם"),
    ("hypotension", "לחץ דם נמוך"),
    ("tachycardia", "טכיקרדיה"),
    ("Tachycardia", "טכיקרדיה"),
    ("seizures", "פרכוסים"),
    ("hallucinations", "הזיות"),
    ("insomnia", "נדודי שינה"),
    ("drowsiness", "נמנום"),
    ("dizziness", "סחרחורת"),
    ("headache", "כאב ראש"),
    ("headaches", "כאבי ראש"),
    ("nausea", "בחילה"),
    ("Nausea", "בחילה"),
    ("vomiting", "הקאות"),
    ("diarrhea", "שלשול"),
    ("Diarrhea", "שלשול"),
    ("constipation", "עצירות"),
    ("Constipation", "עצירות"),
    ("bloating", "נפיחות"),
    ("flatulence", "גזים"),
    ("cramping", "התכווצויות"),
    ("abdominal", "בטני"),
    ("skin rash", "פריחה בעור"),
    ("skin lesions", "נגעי עור"),
    ("skin irritation", "גירוי עור"),
    ("dermatitis", "דרמטיטיס"),
    ("Contact dermatitis", "דרמטיטיס מגע"),
    ("urticaria", "אורטיקריה"),
    ("hives", "פריחה"),
    ("wheezing", "צפצופים"),
    ("confusion", "בלבול"),
    ("anxiety", "חרדה"),
    ("Anxiety", "חרדה"),
    ("panic attacks", "התקפי פאניקה"),
    ("dry mouth", "יובש בפה"),
    ("acid reflux", "ריפלוקס חומצי"),
    ("heartburn", "צרבת"),
    ("burning sensation", "תחושת צריבה"),
    ("stomach pain", "כאב בטן"),
    ("hair loss", "נשירת שיער"),
    ("flushing", "סמקה"),
    ("Flushing", "סמקה"),
    ("itching", "גירוד"),

    # Medical conditions
    ("liver damage", "נזק לכבד"),
    ("Liver damage", "נזק לכבד"),
    ("kidney damage", "נזק לכליות"),
    ("kidney stones", "אבני כליות"),
    ("Kidney stones", "אבני כליות"),
    ("kidney problems", "בעיות כליות"),
    ("kidney concerns", "חששות כלייתיים"),
    ("kidney/liver damage", "נזק לכליות/כבד"),
    ("bone mineral density", "צפיפות מינרלים בעצם"),
    ("osteoporosis", "אוסטאופורוזיס"),
    ("dental erosion", "שחיקת שיניים"),
    ("dental caries", "עששת"),
    ("obesity", "השמנה"),
    ("diabetes", "סוכרת"),
    ("cancer", "סרטן"),
    ("lung cancer", "סרטן ריאות"),
    ("colon cancer", "סרטן המעי הגס"),
    ("colorectal cancer", "סרטן מעי גס-חלחולת"),
    ("breast cancer", "סרטן השד"),
    ("liver cancer", "סרטן הכבד"),
    ("blood sugar", "סוכר בדם"),
    ("blood pressure", "לחץ דם"),
    ("DNA damage", "נזק ל-DNA"),
    ("iron overload", "עומס ברזל"),
    ("copper deficiency", "מחסור בנחושת"),
    ("infertility", "אי-פוריות"),
    ("gout", "גאוט"),
    ("metabolic issues", "בעיות מטבוליות"),
    ("fatty liver", "כבד שומני"),

    # Qualifiers
    ("at high doses", "במינונים גבוהים"),
    ("at very high doses", "במינונים גבוהים מאוד"),
    ("at high intake", "בצריכה גבוהה"),
    ("at excessive intake", "בצריכה מופרזת"),
    ("at low levels", "ברמות נמוכות"),
    ("in sensitive individuals", "באנשים רגישים"),
    ("in sensitized individuals", "באנשים מרוגשים"),
    ("in children", "בילדים"),
    ("in animals", "בבעלי חיים"),
    ("in animal studies", "במחקרי בעלי חיים"),
    ("in studies", "במחקרים"),
    ("in smokers", "במעשנים"),
    ("animal studies", "מחקרי בעלי חיים"),
    ("limited data", "מידע מוגבל"),
    ("limited safety data", "נתוני בטיחות מוגבלים"),
    ("limited studies", "מחקרים מוגבלים"),
    ("limited research", "מחקר מוגבל"),
    ("limited recent studies", "מחקרים עדכניים מוגבלים"),
    ("limited commercial use", "שימוש מסחרי מוגבל"),
    ("potential", "פוטנציאלי"),
    ("Potential", "פוטנציאלי"),
    ("possible", "אפשרי"),
    ("Possible", "אפשרי"),
    ("debated", "שנוי במחלוקת"),
    ("reported (rare)", "דווח (נדיר)"),
    ("(rare)", "(נדיר)"),
    ("(acute)", "(חריף)"),
    ("(animal)", "(בעלי חיים)"),
    ("(high dose)", "(מינון גבוה)"),

    # Food/ingredient terms
    ("Dairy allergen", "אלרגן חלב"),
    ("dairy allergen", "אלרגן חלב"),
    ("Gluten allergen", "אלרגן גלוטן"),
    ("gluten-free", "ללא גלוטן"),
    ("Gluten-free", "ללא גלוטן"),
    ("allergen", "אלרגן"),
    ("Allergen", "אלרגן"),
    ("prebiotic", "פרה-ביוטי"),
    ("Prebiotic", "פרה-ביוטי"),
    ("preservative", "משמר"),
    ("antioxidant", "נוגד חמצון"),
    ("Antioxidant", "נוגד חמצון"),
    ("emulsifier", "מתחלב"),
    ("sweetener", "ממתיק"),
    ("natural", "טבעי"),
    ("Natural", "טבעי"),
    ("synthetic", "סינתטי"),
    ("Synthetic", "סינתטי"),
    ("organic", "אורגני"),
    ("caloric", "קלורי"),
    ("Caloric", "קלורי"),
    ("saturated fat", "שומן רווי"),
    ("trans fats", "שומני טרנס"),
    ("cholesterol", "כולסטרול"),
    ("sodium", "נתרן"),
    ("protein", "חלבון"),
    ("fiber", "סיב תזונתי"),
    ("soluble fiber", "סיב מסיס"),
    ("vitamin", "ויטמין"),
    ("Vitamin", "ויטמין"),
    ("mineral", "מינרל"),
    ("flavonoid", "פלבונואיד"),
    ("lycopene", "ליקופן"),
    ("caffeine", "קפאין"),
    ("Caffeine", "קפאין"),
    ("alcohol", "אלכוהול"),
    ("gluten", "גלוטן"),
    ("lactose", "לקטוז"),
    ("fructose", "פרוקטוז"),
    ("sucrose", "סוכרוז"),
    ("glucose", "גלוקוז"),
    ("starch", "עמילן"),
    ("sugar", "סוכר"),

    # Processes/properties
    ("Concentrated", "מרוכז"),
    ("concentrated", "מרוכז"),
    ("Dehydrated", "מיובש"),
    ("dehydrated", "מיובש"),
    ("fermented", "מותסס"),
    ("Fermented", "מותסס"),
    ("oxidative stress", "עקה חמצונית"),
    ("inflammation", "דלקת"),
    ("pro-inflammatory", "פרו-דלקתי"),
    ("anti-inflammatory", "אנטי-דלקתי"),
    ("Anti-inflammatory", "אנטי-דלקתי"),
    ("reproductive", "לפוריות"),
    ("chloracne", "כלורקנה"),
    ("vasoconstriction", "כיווץ כלי דם"),
    ("gangrene", "גנגרנה"),
    ("bioavailability", "זמינות ביולוגית"),
    ("Bioavailability", "זמינות ביולוגית"),
    ("contamination", "זיהום"),
    ("Contamination", "זיהום"),
    ("heavy metals", "מתכות כבדות"),

    # Common endings/phrases
    ("academic research only", "מחקר אקדמי בלבד"),
    ("under re-evaluation", "בהערכה מחודשת"),
    ("under evaluation", "בהערכה"),
    ("safety under evaluation", "בטיחות בהערכה"),
    ("concerns", "חששות"),
    ("concern", "חשש"),
]


def auto_translate(text):
    """Translate using phrase replacement."""
    result = text
    for en, he in PHRASE_MAP:
        result = result.replace(en, he)
    return result


def escape_sql(s):
    return s.replace("'", "''")


# Direct translations for complex/unique texts
DIRECT = {
    "Carotenodermia (yellow/orange skin); Increased lung cancer risk in smokers": "קרוטנודרמיה (עור צהוב/כתום); סיכון מוגבר לסרטן ריאות במעשנים",
    "Causes flatulence; prebiotic; negligible sweetness": "גורם לגזים; פרה-ביוטי; מתיקות זניחה",
    "Cereal grain. Versatile crop used in hundreds of derivatives.": "גרעין דגן. גידול רב-שימושי במאות מוצרים.",
    "Chelation; kidney concerns": "כילוט; חששות כלייתיים",
    "Chemical leavening agent. E500. Also used as antacid.": "חומר תפיחה כימי. E500. משמש גם כנוגד חומצה.",
    "Chemically synthesized flavor. Same molecules as natural in many cases.": "טעם מסונתז כימית. מולקולות זהות לטבעי במקרים רבים.",
    "Choking hazard (EU jelly mini-cup ban)": "סכנת חנק (איסור כוסיות ג'לי קטנות באיחוד האירופי)",
    "Choking hazard in jelly mini-cups (EU restriction)": "סכנת חנק בכוסיות ג'לי קטנות (הגבלת האיחוד האירופי)",
    "Choking risk (EU jelly ban); prebiotic benefit": "סיכון חנק (איסור ג'לי באיחוד האירופי); יתרון פרה-ביוטי",
    "Citrinin and monacolin K concerns": "חששות ציטרינין ומונקולין K",
    "Citrinin contamination concern": "חשש מזיהום ציטרינין",
    "Citrinin contamination concern from Monascus": "חשש מזיהום ציטרינין ממונסקוס",
    "Citrinin contamination concerns; not approved in EU/USA": "חששות זיהום ציטרינין; לא מאושר באיחוד האירופי/ארה\"ב",
    "Citrinin contamination risk; not approved in West": "סיכון זיהום ציטרינין; לא מאושר במערב",
    "Cocoa with cocoa butter removed. Dutch-process vs natural.": "קקאו ללא חמאת קקאו. תהליך הולנדי לעומת טבעי.",
    "Collective term for dried plant-based seasonings. Composition varies.": "מונח כולל לתבלינים צמחיים מיובשים. ההרכב משתנה.",
    "Combination of natural and synthetic flavors.": "שילוב של טעמים טבעיים וסינתטיים.",
    "Common fruit. Allergen (Bet v 1 cross-reaction).": "פרי נפוץ. אלרגן (תגובה צולבת Bet v 1).",
    "Common protein source; allergen risk if egg-allergic": "מקור חלבון נפוץ; סיכון אלרגני ברגישות לביצים",
    "Common spice. Ceylon vs Cassia types. Cassia has coumarin concerns.": "תבלין נפוץ. סוגי צילון מול קסיה. לקסיה חששות קומרין.",
    "Concentrated apple juice. Used as natural sweetener.": "מיץ תפוחים מרוכז. בשימוש כממתיק טבעי.",
    "Concentrated lemon juice. Natural acidulant and preservative.": "מיץ לימון מרוכז. מחמצן ומשמר טבעי.",
    "Concentrated sugar; excessive consumption linked to fatty liver and metabolic issues": "סוכר מרוכז; צריכה מופרזת קשורה לכבד שומני ובעיות מטבוליות",
    "Concentrated tomatoes. Rich in lycopene.": "עגבניות מרוכזות. עשיר בליקופן.",
    "Concern: trans fats from hydrogenation process.": "חשש: שומני טרנס מתהליך הידרוגנציה.",
    "Converts sour/acidic taste to sweet for 30-60 min; potential diabetic aid": "הופך טעם חמוץ/חומצי למתוק ל-30-60 דקות; סיוע אפשרי לסוכרתיים",
    "Converts to nitrites then nitrosamines; toddlers highest risk": "מתמיר לניטריטים ואז ניטרוזמינים; פעוטות בסיכון הגבוה ביותר",
    "Corn starch modified for improved stability. May use chemical/enzymatic treatment.": "עמילן תירס משופר ליציבות. עשוי לעבור טיפול כימי/אנזימטי.",
    "Corn-derived sweetener. 42% or 55% fructose. Controversial - linked to obesity debate.": "ממתיק ממקור תירס. 42% או 55% פרוקטוז. שנוי במחלוקת — קשור לוויכוח השמנה.",
    "Corrosive when concentrated; safe in food-grade dilution": "מאכל בריכוז; בטוח בדילול למזון",
    "Corrosive, skin burns": "מאכל, כוויות עור",
    "Decomposes on baking; ammonia odor": "מתפרק באפייה; ריח אמוניה",
    "Dehydrated garlic. Concentrated flavor.": "שום מיובש. טעם מרוכז.",
    "Dehydrated onion pieces.": "חתיכות בצל מיובש.",
    "Dehydrated onion.": "בצל מיובש.",
    "Dehydrated onion. Common in seasoning blends.": "בצל מיובש. נפוץ בתערובות תיבול.",
    "Dehydrated skim milk. Long shelf life. Dairy allergen.": "חלב רזה מיובש. חיי מדף ארוכים. אלרגן חלב.",
    "Dried grapes. High in sugar and iron.": "ענבים מיובשים. עשיר בסוכר וברזל.",
    "Dried ground tomatoes. Concentrated lycopene.": "עגבניות טחונות מיובשות. ליקופן מרוכז.",
    "Dough conditioner and emulsifier. GRAS. ADI 22 mg/kg bw.": "מרכך בצק ומתחלב. GRAS. ADI 22 מ\"ג/ק\"ג.",
    "E101. Yellow vitamin. Essential for energy metabolism.": "E101. ויטמין צהוב. חיוני למטבוליזם אנרגיה.",
    "E102 lake form. Insoluble pigment for solid foods.": "E102 בצורת לייק. פיגמנט בלתי מסיס למזון מוצק.",
    "E110 lake form. Insoluble pigment.": "E110 בצורת לייק. פיגמנט בלתי מסיס.",
    "E132 lake form.": "E132 בצורת לייק.",
    "E133 lake form.": "E133 בצורת לייק.",
    "E160a. Natural orange pigment. Converts to vitamin A in body.": "E160a. פיגמנט כתום טבעי. מתמיר לויטמין A בגוף.",
    "E160c. Natural red-orange color from paprika. Also provides flavor.": "E160c. צבע אדום-כתום טבעי מפפריקה. גם מוסיף טעם.",
    "E410. Also called Locust Bean Gum. Thickener and stabilizer.": "E410. ידוע גם כגאם חרובים. מעבה ומייצב.",
    "E414. Also called Gum Arabic. Natural stabilizer.": "E414. ידוע גם כגאם ערבי. מייצב טבעי.",
    "E471. Common emulsifier. May contain trans fats from processing.": "E471. מתחלב נפוץ. עשוי להכיל שומני טרנס מעיבוד.",
    "Egg allergen concern": "חשש אלרגן ביצים",
    "Egg allergen. Pure protein, no fat. Used as leavening.": "אלרגן ביצים. חלבון טהור, ללא שומן. משמש לתפיחה.",
    "Egg allergy risk; GI discomfort possible": "סיכון אלרגיית ביצים; אי נוחות במערכת העיכול אפשרית",
    "EU-listed allergen. Used in condiments.": "אלרגן ברשימת האיחוד האירופי. בשימוש בתבלינים.",
    "Ergotism (vasoconstriction, gangrene); uterine contractions; hallucinations; headaches": "ארגוטיזם (כיווץ כלי דם, גנגרנה); התכווצויות רחם; הזיות; כאבי ראש",
    "Ergotism; vasoconstriction; uterine contractions": "ארגוטיזם; כיווץ כלי דם; התכווצויות רחם",
    "Essential mineral, toxic at high doses": "מינרל חיוני, רעיל במינונים גבוהים",
    "Essentially same as white sugar with trace molasses": "זהה בעיקרו לסוכר לבן עם שאריות מולסה",
    "Essentially same as white sugar with trace molasses; large crystals": "זהה בעיקרו לסוכר לבן עם שאריות מולסה; גבישים גדולים",
    "Excessive intake may cause acidosis": "צריכה מופרזת עלולה לגרום לחמצת",
    "Excessive phosphate intake linked to cardiovascular concerns": "צריכת פוספט מופרזת קשורה לחששות לב וכלי דם",
    "Excessive zinc intake may cause copper deficiency": "צריכת אבץ מופרזת עלולה לגרום למחסור בנחושת",
    "Fat component of milk. Also called butterfat. Dairy allergen.": "רכיב השומן בחלב. נקרא גם שומן חמאה. אלרגן חלב.",
    "Fat-rich part of egg. Contains lecithin, cholesterol. Allergen.": "חלק עשיר בשומן של הביצה. מכיל לציטין, כולסטרול. אלרגן.",
    "Fat-soluble vitamin A. Added to dairy, cereals. Teratogenic at high doses.": "ויטמין A מסיס בשומן. מתווסף למוצרי חלב, דגנים. טרטוגני במינונים גבוהים.",
    "Few safety concerns; limited recent studies": "מעט חששות בטיחותיים; מחקרים עדכניים מוגבלים",
    "Finely ground corn. Gluten-free. Used in tortillas.": "תירס טחון עדין. ללא גלוטן. בשימוש בטורטיות.",
    "Fresh coriander leaves. Divisive taste (genetic component).": "עלי כוסברה טריים. טעם מפלג (מרכיב גנטי).",
    "Fruit/vegetable. Rich in lycopene. Nightshade family.": "פרי/ירק. עשיר בליקופן. ממשפחת הסולניים.",
    "FDA evaluated; safe": "הוערך ע\"י FDA; בטוח",
    "FDA-defined: flavor derived from plant/animal sources. Exact composition proprietary.": "מוגדר ע\"י FDA: טעם ממקור צמחי/חייתי. ההרכב המדויק קנייני.",
    "Forms carcinogenic nitrosamines; WHO Group 1 via processed meat; 18% increased colorectal cancer per 50g/day": "יוצר ניטרוזמינים מסרטנים; קבוצה 1 של WHO דרך בשר מעובד; 18% עלייה בסרטן מעי גס-חלחולת ל-50 גרם/יום",
    "Forms formaldehyde, genotoxicity concerns": "יוצר פורמלדהיד, חששות רעילות גנטית",
    "Beneficial for digestion and heart health": "מיטיב לעיכול ולבריאות הלב",
}


# Process all concerns
sql_lines = []
still_remaining = []

for c in concerns:
    if c in DIRECT:
        he = DIRECT[c]
    else:
        he = auto_translate(c)
        # Check if translation actually changed (has Hebrew chars)
        if he == c:
            still_remaining.append(c)
            continue
        # Check if at least some Hebrew was added
        has_hebrew = any('\u0590' <= ch <= '\u05FF' for ch in he)
        if not has_hebrew:
            still_remaining.append(c)
            continue

    sql_lines.append(
        f"UPDATE food_additives SET health_concerns_he = '{escape_sql(he)}' WHERE health_concerns = '{escape_sql(c)}';"
    )

with open("C:/BENDA_PROJECT/HEALTHYSCAN/scripts/sql/health_concerns_he_batch3.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines))

with open("C:/BENDA_PROJECT/HEALTHYSCAN/scripts/final_untranslated.json", "w", encoding="utf-8") as f:
    json.dump(still_remaining, f, ensure_ascii=False, indent=2)

print(f"Batch 3: {len(sql_lines)} translated")
print(f"Still untranslated: {len(still_remaining)}")

# Show some auto-translated samples
print("\nSample auto-translations:")
for c in concerns[:10]:
    if c not in DIRECT and c not in still_remaining:
        print(f"  EN: {c}")
        print(f"  HE: {auto_translate(c)}")
        print()
