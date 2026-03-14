#!/usr/bin/env python3
"""Batch 2: Translate remaining health_concerns to Hebrew."""
import json

with open("C:/BENDA_PROJECT/HEALTHYSCAN/scripts/untranslated_concerns.json", encoding="utf-8") as f:
    concerns = json.load(f)

# Full translation dictionary for ALL remaining concerns
TRANSLATIONS = {
    # === FOOD DESCRIPTIONS ===
    "100% cacao. No sugar added. Contains theobromine.": "100% קקאו. ללא סוכר. מכיל תאוברומין.",
    "3.25% fat milk. Dairy allergen.": "חלב 3.25% שומן. אלרגן חלב.",
    "5% acetic acid. Natural preservative and flavoring.": "5% חומצה אצטית. משמר וממטעם טבעי.",
    "80%+ protein from milk. Dairy allergen. Used in protein bars.": "80%+ חלבון מחלב. אלרגן חלב. בשימוש בחטיפי חלבון.",
    "Alkalized cocoa powder. Milder flavor, darker color. Reduced flavanols.": "אבקת קקאו מושהת. טעם עדין יותר, צבע כהה יותר. פלבנולים מופחתים.",
    "Aromatic herb. Common in Italian and Thai cuisine.": "עשב תיבול ארומטי. נפוץ במטבח האיטלקי והתאילנדי.",
    "Artisanal production; hand-kneaded; extremely fine texture; caloric": "ייצור אומנותי; לישה ידנית; מרקם עדין במיוחד; קלורי",
    "Animal fat used in cooking and processed foods. Not halal/kosher without cert.": "שומן מן החי בבישול ומזון מעובד. לא חלאל/כשר ללא תעודה.",
    "Animal fat; contains saturated fat": "שומן מן החי; מכיל שומן רווי",
    "Bacterial cultures for cheese production. Various strains.": "תרביות חיידקים לייצור גבינה. זנים שונים.",
    "Berry fruit. Common allergen in children.": "פרי יער. אלרגן נפוץ בילדים.",
    "Biological leavening agent. Used in bread, beer, wine.": "חומר תפיחה ביולוגי. בשימוש בלחם, בירה, יין.",
    "Byproduct of cheese making. Dairy allergen. High in protein.": "תוצר לוואי של ייצור גבינה. אלרגן חלב. עשיר בחלבון.",
    "Basic seasoning, essential mineral. WHO recommends <5g/day. Excessive intake linked to hypertension.": "תיבול בסיסי, מינרל חיוני. WHO ממליץ <5 גרם/יום. צריכה מופרזת קשורה ליתר לחץ דם.",

    # === ATP/METABOLIC ===
    "ATP synthesis support; used for chronic fatigue; mildly sweet pentose sugar": "תמיכה בסינתזת ATP; בשימוש בעייפות כרונית; סוכר פנטוז מתוק קלות",
    "Accumulation linked to galactosemia; limited commercial use": "הצטברות קשורה לגלקטוסמיה; שימוש מסחרי מוגבל",

    # === ACNE/HORMONAL ===
    "Acne, hair loss, mood changes, hormone disruption; raises T in women": "אקנה, נשירת שיער, שינויי מצב רוח, שיבוש הורמונלי; מעלה טסטוסטרון בנשים",

    # === ACUTE TOXICITY ===
    "Acute cyanide poisoning; respiratory failure; neurological damage; chronic: thyroid effects": "הרעלת ציאניד חריפה; כשל נשימתי; נזק עצבי; כרוני: השפעה על בלוטת התריס",

    # === ADAPTOGENIC ===
    "Adaptogenic herb; sweet saponins; limited safety data as food additive": "עשב אדפטוגני; ספונינים מתוקים; נתוני בטיחות מוגבלים כתוסף מזון",

    # === ALLERGEN COMPLEX ===
    "Allergen-free alternative to corn maltodextrin; very high GI; used as bulking agent": "חלופה ללא אלרגנים למלטודקסטרין תירס; מדד גליקמי גבוה מאוד; בשימוש כחומר מילוי",
    "Allergic reactions; asthma exacerbation; urticaria; intolerance in aspirin-sensitive individuals": "תגובות אלרגיות; החמרת אסטמה; אורטיקריה; אי-סבילות ברגישים לאספירין",
    "Allergic reactions; histamine release; asthma trigger; teratogenicity (animal); hepatotoxicity (high dose)": "תגובות אלרגיות; שחרור היסטמין; מעורר אסטמה; טרטוגניות (בעלי חיים); רעילות כבדית (מינון גבוה)",
    "Allergic/hypersensitivity reactions; pro-inflammatory; fertility effects (high dose); genotoxicity (plant models)": "תגובות אלרגיות/רגישות יתר; פרו-דלקתי; השפעות על פוריות (מינון גבוה); רעילות גנטית (מודלים צמחיים)",
    "Asthma triggers, severe allergic reactions": "עלול לעורר אסטמה, תגובות אלרגיות חמורות",
    "Asthma in 3-10% of asthmatics; hives; wheezing; anaphylaxis; intakes often exceed ADI": "אסטמה ב-3-10% מהאסתמטיים; פריחה; צפצופים; אנפילקסיס; צריכה חורגת לעתים מה-ADI",

    # === ALTERNATE SPELLINGS ===
    "Alternate spelling of Modified Corn Starch.": "איות חלופי של עמילן תירס משופר.",
    "Alternate spelling of Thiamine Mononitrate. Same compound.": "איות חלופי של תיאמין מונוניטראט. אותה תרכובת.",

    # === SWEETENERS ===
    "Among most potent sweeteners; academic research only": "בין הממתיקים החזקים ביותר; מחקר אקדמי בלבד",
    "Bioidentical to plant-derived steviol glycosides": "זהה ביולוגית לגליקוזידי סטביול ממקור צמחי",
    "Biomarker for certain fungal infections; not used commercially as sweetener": "סמן ביולוגי לזיהומים פטרייתיים; לא בשימוש מסחרי כממתיק",
    "Blocks sweet taste receptors; used in diabetes management; may lower blood sugar": "חוסם קולטני טעם מתוק; בשימוש בניהול סוכרת; עשוי להוריד סוכר בדם",
    "C4 sugar; metabolic intermediate; not used as sweetener commercially": "סוכר C4; מתווך מטבולי; לא בשימוש מסחרי כממתיק",
    "Caloric (4.32 kcal/g); osmotic laxative at very high doses; widely used as humectant": "קלורי (4.32 קק\"ל/גרם); משלשל אוסמוטי במינונים גבוהים מאוד; בשימוש נרחב כלחלחן",
    "Caloric sugar syrup; same concerns as sucrose": "סירופ סוכר קלורי; חששות זהים לסוכרוז",
    "Cannot be metabolized by humans; zero calories but extremely expensive": "לא ניתן לפירוק מטבולי בבני אדם; אפס קלוריות אך יקר במיוחד",
    "Calcium salt form of cyclamate": "צורת מלח סידן של ציקלמט",

    # === ANTICHOLINERGIC ===
    "Anticholinergic effects similar to atropine; drowsiness; confusion": "השפעות אנטיכולינרגיות דומות לאטרופין; נמנום; בלבול",
    "Anticholinergic effects: tachycardia; dilated pupils; dry mouth; hallucinations; seizures (acute)": "השפעות אנטיכולינרגיות: טכיקרדיה; אישונים מורחבים; יובש בפה; הזיות; פרכוסים (חריף)",
    "Anticancer properties studied; not food-approved": "תכונות נגד סרטן נחקרו; לא מאושר למזון",
    "Antinutritional; liver damage at high doses": "אנטי-תזונתי; נזק לכבד במינונים גבוהים",
    "Antioxidant; anti-obesity claims studied": "נוגד חמצון; טענות נגד השמנה נחקרו",
    "Anxiety, tachycardia, hypertension, panic attacks, nausea, insomnia": "חרדה, טכיקרדיה, יתר לחץ דם, התקפי פאניקה, בחילה, נדודי שינה",
    "Argyria (silver skin discoloration) at excessive intake; safe in trace amounts": "ארגיריה (שינוי צבע עור מכסף) בצריכה מופרזת; בטוח בכמויות זעירות",

    # === BANNED COMPLEX ===
    "Banned EU/Australia; used in rubber/plastics; yoga mat chemical": "אסור באיחוד האירופי/אוסטרליה; בשימוש בגומי/פלסטיק; כימיקל מזרני יוגה",
    "Banned EU/Japan; FDA revoked GRAS 2024; headaches, memory loss; bromine accumulates": "אסור באיחוד האירופי/יפן; FDA ביטל GRAS 2024; כאבי ראש, אובדן זיכרון; ברום מצטבר",
    "Banned EU/UK/Canada; inhibits vitamin absorption; GI distress": "אסור באיחוד האירופי/בריטניה/קנדה; מעכב ספיגת ויטמינים; מצוקה במערכת העיכול",
    "Banned for direct food use, liver concerns": "אסור לשימוש ישיר במזון, חששות כבדיים",
    "Banned in US due to historical cancer concerns in rats; approved in EU/Canada/many countries": "אסור בארה\"ב בשל חשש היסטורי לסרטן בחולדות; מאושר באיחוד האירופי/קנדה/מדינות רבות",

    # === BENEFICIAL ===
    "Beneficial for digestion and heart health": "מיטיב לעיכול ולבריאות הלב",
    "Bitter taste; generally well-tolerated": "טעם מר; נסבל היטב בדרך כלל",
    "Bulking agent; mild laxative at very high doses; soluble fiber": "חומר מילוי; משלשל קל במינונים גבוהים מאוד; סיב מסיס",

    # === BIOACCUMULATION ===
    "Bioaccumulation in tissues (liver, spleen, lymph nodes); granuloma formation in animals": "הצטברות ביולוגית ברקמות (כבד, טחול, בלוטות לימפה); היווצרות גרנולומה בבעלי חיים",

    # === BRAIN/CNS ===
    "Brain tumors in male rats; nausea; allergic reactions": "גידולי מוח בחולדות זכרים; בחילה; תגובות אלרגיות",
    "CNS depression; respiratory depression; dependence (at high acute doses)": "דיכוי מערכת העצבים המרכזית; דיכוי נשימתי; התמכרות (במינונים חריפים גבוהים)",

    # === CAFFEINE ===
    "Caffeine-free; high in calcium; lower GI than sugar; tannin content": "ללא קפאין; עשיר בסידן; מדד גליקמי נמוך מסוכר; תכולת טאנין",
    "Caffeine-related effects; long-term high consumption linked to esophageal concerns": "השפעות הקשורות לקפאין; צריכה גבוהה ארוכת טווח קשורה לחששות בוושט",

    # === CARCINOGENICITY COMPLEX ===
    "Carcinogenic concerns": "חששות סרטוגניים",
    "Carcinogenicity (colon, breast, prostate in animals); mutagenicity": "סרטוגניות (מעי גס, שד, ערמונית בבעלי חיים); מוטגניות",
    "Carcinogenicity (liver in animals)": "סרטוגניות (כבד בבעלי חיים)",
    "Carcinogenicity (liver, esophagus in animals)": "סרטוגניות (כבד, וושט בבעלי חיים)",
    "Carcinogenicity (liver, esophagus); genotoxicity": "סרטוגניות (כבד, וושט); רעילות גנטית",
    "Carcinogenicity (liver, kidney in animals); genotoxicity": "סרטוגניות (כבד, כליות בבעלי חיים); רעילות גנטית",
    "Carcinogenicity (lung, GI tract); genotoxicity; nephrotoxicity; dermal sensitization": "סרטוגניות (ריאות, מערכת עיכול); רעילות גנטית; רעילות כלייתית; רגישות עורית",
    "Carcinogenicity (lung, bladder, skin); cardiovascular disease; diabetes; dermal lesions; neurotoxicity": "סרטוגניות (ריאות, שלפוחית, עור); מחלות לב וכלי דם; סוכרת; נגעי עור; רעילות עצבית",
    "Carcinogenicity (lung, liver, lymphoma in animals); genotoxicity": "סרטוגניות (ריאות, כבד, לימפומה בבעלי חיים); רעילות גנטית",
    "Carcinogenicity (nasopharyngeal \u05d2\u20ac\u201c inhalation); irritation; sensitization": "סרטוגניות (אף-לוע — שאיפה); גירוי; רגישות",
    "Carcinogenicity (upper aerodigestive tract as alcohol metabolite); mutagenicity; irritation": "סרטוגניות (מערכת עיכול ונשימה עליונה כמטבוליט אלכוהול); מוטגניות; גירוי",
    "Carcinogenicity; cardiovascular disease; skin lesions": "סרטוגניות; מחלות לב וכלי דם; נגעי עור",
    "Carcinogenicity; cardiovascular; skin lesions": "סרטוגניות; לב וכלי דם; נגעי עור",
    "Carcinogenicity; chloracne; immunotoxicity; reproductive toxicity; endocrine disruption": "סרטוגניות; כלורקנה; רעילות חיסונית; רעילות לפוריות; שיבוש הורמונלי",
    "Carcinogenicity; genotoxicity (among the most potent PAHs)": "סרטוגניות; רעילות גנטית (בין ה-PAH החזקים ביותר)",
    "Carcinogenicity; genotoxicity; immunosuppression": "סרטוגניות; רעילות גנטית; דיכוי חיסוני",
    "Carcinogenicity; genotoxicity; mutagenicity; immunotoxicity": "סרטוגניות; רעילות גנטית; מוטגניות; רעילות חיסונית",
    "Carcinogenicity; hepatotoxicity": "סרטוגניות; רעילות כבדית",
    "Carcinogenicity; hepatotoxicity (least potent of the four major aflatoxins)": "סרטוגניות; רעילות כבדית (החלש מבין ארבעת האפלטוקסינים העיקריים)",
    "Carcinogenicity; hepatotoxicity (less potent than AFB1)": "סרטוגניות; רעילות כבדית (פחות חזק מ-AFB1)",
    "Carcinogenicity; hepatotoxicity; carried into milk from aflatoxin B1 in animal feed": "סרטוגניות; רעילות כבדית; עובר לחלב מאפלטוקסין B1 במזון לבעלי חיים",
    "Carcinogenicity; hepatotoxicity; genotoxicity": "סרטוגניות; רעילות כבדית; רעילות גנטית",
    "Carcinogenicity; immunotoxicity; neurodevelopmental effects; endocrine disruption": "סרטוגניות; רעילות חיסונית; השפעות נוירו-התפתחותיות; שיבוש הורמונלי",
}

def escape_sql(s):
    return s.replace("'", "''")

sql_lines = []
translated_count = 0
still_untranslated = []

for c in concerns:
    if c in TRANSLATIONS:
        he = TRANSLATIONS[c]
        sql_lines.append(
            f"UPDATE food_additives SET health_concerns_he = '{escape_sql(he)}' WHERE health_concerns = '{escape_sql(c)}';"
        )
        translated_count += 1
    else:
        still_untranslated.append(c)

with open("C:/BENDA_PROJECT/HEALTHYSCAN/scripts/sql/health_concerns_he_batch2.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines))

with open("C:/BENDA_PROJECT/HEALTHYSCAN/scripts/still_untranslated.json", "w", encoding="utf-8") as f:
    json.dump(still_untranslated, f, ensure_ascii=False, indent=2)

print(f"Batch 2: {translated_count} translated")
print(f"Still untranslated: {len(still_untranslated)}")
print(f"SQL file: health_concerns_he_batch2.sql ({len(sql_lines)} statements)")
