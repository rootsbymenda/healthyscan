"""
Fix all partially translated health_concerns entries.
Instead of pattern-based replacement, provide complete direct translations
for every text that still has English in the Hebrew field.
"""
import json
import os

# Complete direct translations for all remaining partially-translated texts
DIRECT = {
    # "Generally safe, X" patterns
    "Generally safe, peptide bacteriocin": "בטוח בדרך כלל, בקטריוצין פפטידי",
    "Generally safe, fungicide": "בטוח בדרך כלל, קוטל פטריות",
    "Generally safe, GRAS, natural vinegar component": "בטוח בדרך כלל, GRAS, מרכיב טבעי של חומץ",
    "Generally safe, natural fermentation product": "בטוח בדרך כלל, תוצר תסיסה טבעי",
    "Generally safe, migraine trigger in sensitive individuals": "בטוח בדרך כלל, עלול לעורר מיגרנה באנשים רגישים",
    "Generally safe, behavioral effects reported (debated)": "בטוח בדרך כלל, דווח על השפעות התנהגותיות (שנוי במחלוקת)",
    "Generally safe, hydrolyzes to CO2 and methanol": "בטוח בדרך כלל, מתפרק ל-CO2 ומתנול",
    "Generally safe, cationic surfactant": "בטוח בדרך כלל, פעיל שטח קטיוני",
    "Generally safe, soy/egg source (allergen if sensitive)": "בטוח בדרך כלל, מקור סויה/ביצה (אלרגן אם רגיש)",
    "Generally safe, natural fruit acid": "בטוח בדרך כלל, חומצת פרי טבעית",
    "Generally safe, natural grape acid": "בטוח בדרך כלל, חומצת ענבים טבעית",
    "Generally safe, high intake affects calcium": "בטוח בדרך כלל, צריכה גבוהה משפיעה על סידן",
    "Generally safe, calcium source": "בטוח בדרך כלל, מקור סידן",
    "Generally safe, mineral chelator (high doses deplete minerals)": "בטוח בדרך כלל, קלטור מינרלים (מינונים גבוהים מדלדלים מינרלים)",
    "Generally safe, natural plant extract": "בטוח בדרך כלל, תמצית צמחית טבעית",
    "Generally safe, prevents discoloration": "בטוח בדרך כלל, מונע שינוי צבע",
    "Generally safe in normal amounts": "בטוח בדרך כלל בכמויות רגילות",
    "Generally safe, 4-MEI concerns debated": "בטוח בדרך כלל, חששות 4-MEI שנויים במחלוקת",
    "Generally safe, may bind minerals": "בטוח בדרך כלל, עלול לקשור מינרלים",
    "Generally safe, high intake increases blood pressure": "בטוח בדרך כלל, צריכה גבוהה מעלה לחץ דם",
    "Generally safe, caution with kidney disease": "בטוח בדרך כלל, זהירות עם מחלת כליות",
    "Generally safe, high intake causes dental/metabolic issues": "בטוח בדרך כלל, צריכה גבוהה גורמת לבעיות שיניים/מטבוליות",
    "Generally safe, high intake causes metabolic issues": "בטוח בדרך כלל, צריכה גבוהה גורמת לבעיות מטבוליות",
    "Generally safe, PAH concerns if excessive": "בטוח בדרך כלל, חששות PAH אם מופרז",
    "Generally safe, withanolides": "בטוח בדרך כלל, ויתנוליידים",
    "Generally safe, high vitamin C": "בטוח בדרך כלל, עשיר בוויטמין C",
    "Generally safe, vitamin C": "בטוח בדרך כלל, ויטמין C",
    "Generally safe, vitamin A form": "בטוח בדרך כלל, צורת ויטמין A",
    "Generally safe, resveratrol": "בטוח בדרך כלל, רסברטרול",
    "Generally safe, quercetin": "בטוח בדרך כלל, קוורצטין",
    "Generally safe, probiotic metabolites": "בטוח בדרך כלל, מטבוליטים פרוביוטיים",
    "Generally safe, proanthocyanidins": "בטוח בדרך כלל, פרואנתוציאנידינים",
    "Generally safe, polymethoxyflavone": "בטוח בדרך כלל, פולימתוקסיפלבון",
    "Generally safe, phytoestrogen": "בטוח בדרך כלל, פיטואסטרוגן",
    "Generally safe, phenolic compound": "בטוח בדרך כלל, תרכובת פנולית",
    "Generally safe, medium-chain fatty acid": "בטוח בדרך כלל, חומצת שומן בינונית שרשרת",
    "Generally safe, linalool": "בטוח בדרך כלל, לינלול",
    "Generally safe, lignans": "בטוח בדרך כלל, ליגנאנים",
    "Generally safe, isoflavones": "בטוח בדרך כלל, איזופלבונים",
    "Generally safe, flavonoids": "בטוח בדרך כלל, פלבנואידים",
    "Generally safe, flavanone glycoside": "בטוח בדרך כלל, גליקוזיד פלבנון",
    "Generally safe, diterpene": "בטוח בדרך כלל, דיטרפן",
    "Generally safe, dipeptide": "בטוח בדרך כלל, דיפפטיד",
    "Generally safe, bacteriocin": "בטוח בדרך כלל, בקטריוצין",
    "Generally safe, apigenin": "בטוח בדרך כלל, אפיגנין",
    "Generally safe, anethole": "בטוח בדרך כלל, אנתול",
    "Generally safe at permitted levels": "בטוח בדרך כלל ברמות מותרות",
    "Generally safe; rare allergic reactions": "בטוח בדרך כלל; תגובות אלרגיות נדירות",
    "Generally safe; laxative at high doses": "בטוח בדרך כלל; משלשל במינונים גבוהים",
    "Generally safe; calcium source": "בטוח בדרך כלל; מקור סידן",
    "Generally safe, terpene compound": "בטוח בדרך כלל, תרכובת טרפן",
    "Generally safe, synephrine": "בטוח בדרך כלל, סינפרין",
    "Generally safe, sesquiterpene": "בטוח בדרך כלל, סקוויטרפן",
    "Generally safe, saponins": "בטוח בדרך כלל, ספונינים",
    "Generally safe, pyrrolizidine caution": "בטוח בדרך כלל, זהירות מפירוליזידין",
    "Generally safe, polyphenol": "בטוח בדרך כלל, פוליפנול",
    "Generally safe, naringenin": "בטוח בדרך כלל, נרינגנין",
    "Generally safe, may interact with medications": "בטוח בדרך כלל, עלול לפעול עם תרופות",
    "Generally safe, luteolin": "בטוח בדרך כלל, לוטאולין",
    "Generally safe, kaempferol": "בטוח בדרך כלל, קמפפרול",
    "Generally safe, hydroxycinnamic acid": "בטוח בדרך כלל, חומצה הידרוקסיקינמית",
    "Generally safe, hydroxybenzaldehyde": "בטוח בדרך כלל, הידרוקסיבנזאלדהיד",
    "Generally safe, gingerols": "בטוח בדרך כלל, ג'ינגרולים",
    "Generally safe, eugenol": "בטוח בדרך כלל, אוגנול",
    "Generally safe, ellagic acid": "בטוח בדרך כלל, חומצה אלגית",
    "Generally safe, curcuminoid": "בטוח בדרך כלל, כורכומינואיד",
    "Generally safe, coumarin limits apply": "בטוח בדרך כלל, חלים מגבלות קומרין",
    "Generally safe, catechins": "בטוח בדרך כלל, קטכינים",
    "Generally safe, caffeoylquinic acid": "בטוח בדרך כלל, חומצה קפאוילקינית",
    "Generally safe, beta-glucan": "בטוח בדרך כלל, בטא-גלוקן",
    "Generally safe, anthocyanin": "בטוח בדרך כלל, אנתוציאנין",
    "Generally safe, aldehyde": "בטוח בדרך כלל, אלדהיד",
    "Generally safe, alkaloid": "בטוח בדרך כלל, אלקלואיד",

    # Vitamin-related
    "Vitamin C, safe, very high doses may cause GI upset": "ויטמין C, בטוח, מינונים גבוהים מאוד עלולים לגרום להפרעה במערכת העיכול",
    "Vitamin E, safe, high doses may affect blood clotting": "ויטמין E, בטוח, מינונים גבוהים עלולים להשפיע על קרישת הדם",
    "Vitamin C stereoisomer, generally safe": "סטריאואיזומר של ויטמין C, בטוח בדרך כלל",
    "Vitamin A precursor, generally safe": "מבשר של ויטמין A, בטוח בדרך כלל",
    "Fat-soluble vitamin C derivative, generally safe": "נגזרת מסיסת שומן של ויטמין C, בטוח בדרך כלל",

    # Vision/DNA
    "Vision disturbances high doses, DNA damage concerns (debated)": "הפרעות ראייה במינונים גבוהים, חששות לנזק ל-DNA (שנוי במחלוקת)",

    # Carcinogens/toxicity
    "Possible carcinogen (conflicting studies), endocrine disruption": "אפשרי מסרטן (מחקרים סותרים), שיבוש אנדוקריני",
    "Suspected carcinogen": "חשוד כמסרטן",
    "Potential toxicity": "רעילות אפשרית",
    "Reproductive toxicity, banned many countries": "רעילות רבייה, אסור במדינות רבות",
    "Hormone disruption concerns, hyperactivity concerns": "חששות לשיבוש הורמונלי, חששות להיפראקטיביות",

    # Safety phrases
    "Safe; contains caffeine": "בטוח; מכיל קפאין",
    "Safe. Natural food coloring.": "בטוח. צבע מזון טבעי.",
    "Safe. Allergen: mustard.": "בטוח. אלרגן: חרדל.",
    "Safe. Allergen: tree nuts.": "בטוח. אלרגן: אגוזי עץ.",
    "Safe. Allergen: soy.": "בטוח. אלרגן: סויה.",
    "Safe. Allergen: sesame.": "בטוח. אלרגן: שומשום.",
    "Safe. Allergen: may contain gluten.": "בטוח. אלרגן: עלול להכיל גלוטן.",
    "Safe. Allergen: gluten.": "בטוח. אלרגן: גלוטן.",
    "Safe. Allergen: eggs.": "בטוח. אלרגן: ביצים.",
    "Safe. May contain allergen: gluten.": "בטוח. עלול להכיל אלרגן: גלוטן.",
    "Safe for most people. Allergen: gluten.": "בטוח לרוב האנשים. אלרגן: גלוטן.",
    "Safe in food; supplements concerning for smokers": "בטוח במזון; תוספים מדאיגים למעשנים",
    "Safe in food amounts; contains alcohol residue": "בטוח בכמויות מזון; מכיל שאריות אלכוהול",
    "Safe; vitamin derivative": "בטוח; נגזרת ויטמין",
    "Safe; trendy natural color": "בטוח; צבע טבעי טרנדי",
    "Safe; trending natural purple color": "בטוח; צבע סגול טבעי טרנדי",
    "Safe; sustainability concerns (environmental)": "בטוח; חששות קיימות (סביבתיים)",
    "Safe; rich in vitamin C": "בטוח; עשיר בוויטמין C",
    "Safe; rare allergic reactions": "בטוח; תגובות אלרגיות נדירות",
    "Safe; pungent varieties may cause GI irritation": "בטוח; זנים חריפים עלולים לגרות את מערכת העיכול",
    "Safe; powerful antioxidant": "בטוח; נוגד חמצון עוצמתי",
    "Safe; natural pigment": "בטוח; פיגמנט טבעי",
    "Safe; natural pH indicator": "בטוח; מחוון pH טבעי",
    "Safe; natural carotene source": "בטוח; מקור קרוטן טבעי",
    "Safe; natural Maillard product": "בטוח; תוצר מאייר טבעי",
    "Safe; mineral supplement": "בטוח; תוסף מינרלי",
    "Safe; high antioxidant": "בטוח; נוגד חמצון גבוה",
    "Safe; essential vitamin": "בטוח; ויטמין חיוני",
    "Safe; contains theobromine/caffeine": "בטוח; מכיל תיאוברומין/קפאין",
    "Safe; antioxidant; urinary benefits": "בטוח; נוגד חמצון; יתרונות לדרכי השתן",
    "Safe; antioxidant flavonoid": "בטוח; פלבנואיד נוגד חמצון",
    "Safe; antioxidant benefits": "בטוח; יתרונות נוגד חמצון",
    "Safe; anti-inflammatory properties": "בטוח; תכונות אנטי-דלקתיות",

    # "No significant concerns" patterns
    "No significant concerns at approved levels": "אין חששות משמעותיים ברמות מאושרות",
    "Limited data; no significant concerns reported": "נתונים מוגבלים; לא דווח על חששות משמעותיים",

    # Nephro/hepato toxicity
    "Nephrotoxicity; bone effects": "רעילות כלייתית; השפעות על עצמות",
    "Natural flavoring; generally safe": "תמצית טעם טבעית; בטוח בדרך כלל",
    "Laxative at high doses": "משלשל במינונים גבוהים",
    "Immunotoxicity; hepatotoxicity; developmental effects": "רעילות חיסונית; רעילות כבדית; השפעות התפתחותיות",
    "Hepatotoxicity (additive to furan toxicity)": "רעילות כבדית (תוספת לרעילות פוראן)",

    # GI-related
    "GI inflammation debate": "ויכוח על דלקת במערכת העיכול",
    "GI discomfort if hypertonic": "אי נוחות במערכת העיכול אם היפרטוני",
    "Emerging; safety under evaluation": "חדש; בטיחות בהערכה",

    # Southampton/Hyperactivity
    "Southampton study hyperactivity; forms benzene with vitamin C": "מחקר סאות'המפטון היפראקטיביות; יוצר בנזן עם ויטמין C",
    "Southampton Six hyperactivity; immune-mediated lung inflammation": "שישיית סאות'המפטון היפראקטיביות; דלקת ריאות בתיווך חיסוני",
    "Southampton Six hyperactivity; banned in US, Japan, Sweden, Norway": "שישיית סאות'המפטון היפראקטיביות; אסור בארה\"ב, יפן, שוודיה, נורבגיה",
    "Southampton Six hyperactivity link; banned in US, Japan, Australia, Norway": "שישיית סאות'המפטון קשר להיפראקטיביות; אסור בארה\"ב, יפן, אוסטרליה, נורבגיה",

    # Sweetener-related
    "Most potent approved sweetener; heat stable; very low amounts needed": "הממתיק המאושר החזק ביותר; יציב בחום; נדרשות כמויות נמוכות מאוד",
    "Whole leaf/crude extract not approved in US; may have bitter/licorice aftertaste": "עלה שלם/תמצית גולמית לא מאושרים בארה\"ב; עלול להיות טעם מר/ליקריץ",
    "Natural plant protein; very low toxicity; EFSA 2021 confirmed safety": "חלבון צמחי טבעי; רעילות נמוכה מאוד; EFSA 2021 אישר בטיחות",
    "Traditional use in China for centuries; no safety concerns identified by FDA": "שימוש מסורתי בסין במשך מאות שנים; לא זוהו חששות בטיחות על ידי FDA",
    "Taste-modifying protein; not a sweetener per se": "חלבון משנה טעם; לא ממתיק כשלעצמו",
    "Serendipity berry protein; heat-labile; difficult production": "חלבון פרי סרנדיפיטי; רגיש לחום; ייצור קשה",
    "Technology approach rather than single ingredient; reduces sugar needed in formulations": "גישה טכנולוגית ולא מרכיב בודד; מפחית צורך בסוכר בניסוחים",

    # High GI sugars
    "Very high GI; rapidly converted to glucose": "אינדקס גליקמי גבוה מאוד; מומר במהירות לגלוקוז",
    "Very high GI; rapidly digested; common filler in sweetener packets": "אינדקס גליקמי גבוה מאוד; מתעכל במהירות; מילוי נפוץ באריזות ממתיק",
    "Very high GI; traditional Japanese syrup; less sweet than sugar": "אינדקס גליקמי גבוה מאוד; סירופ יפני מסורתי; פחות מתוק מסוכר",
    "Very high GI; less sweet than sucrose; used for texture": "אינדקס גליקמי גבוה מאוד; פחות מתוק מסוכרוז; משמש למרקם",
    "Very high GI; double glucose unit; rapidly absorbed": "אינדקס גליקמי גבוה מאוד; יחידת גלוקוז כפולה; נספג במהירות",
    "Very high GI; concerns about arsenic content from rice; fructose-free": "אינדקס גליקמי גבוה מאוד; חששות לתכולת ארסן מאורז; ללא פרוקטוז",
    "Very high fructose content; low GI but same liver metabolism concerns as fructose; marketed as 'natural' alternative": "תכולת פרוקטוז גבוהה מאוד; אינדקס גליקמי נמוך אך אותם חששות מטבוליזם כבדי כמו פרוקטוז; משווק כחלופה 'טבעית'",
    "Slow-release energy; lower GI than sucrose": "אנרגיה בשחרור איטי; אינדקס גליקמי נמוך מסוכרוז",
    "Simple sugar (glucose). Lower sweetness than sucrose. Used in baking, IVs.": "סוכר פשוט (גלוקוז). מתיקות נמוכה מסוכרוז. משמש באפייה ובעירוי.",

    # Polyols/prebiotics/laxatives
    "High doses may cause hypertension, hypokalemia; not recommended for prolonged high intake": "מינונים גבוהים עלולים לגרום ליתר לחץ דם, היפוקלמיה; לא מומלץ לצריכה גבוהה ממושכת",
    "Laxative effect at high doses (>20g/day); osmotic diarrhea; EU laxative warning required >10% polyol": "אפקט משלשל במינונים גבוהים (>20 גרם/יום); שלשול אוסמוטי; נדרשת אזהרת EU למשלשל >10% פוליאול",
    "Strong prebiotic/laxative effect; FDA-approved as prescription laxative; derived from lactose": "השפעה פרה-ביוטית/משלשלת חזקה; מאושר FDA כמשלשל במרשם; מופק מלקטוז",
    "Strong prebiotic; gas/bloating at high doses; low caloric value": "פרה-ביוטי חזק; גזים/נפיחות במינונים גבוהים; ערך קלורי נמוך",
    "Strong prebiotic; gas/bloating at high doses (>20g/day); calcium absorption benefits": "פרה-ביוטי חזק; גזים/נפיחות במינונים גבוהים (>20 גרם/יום); יתרונות ספיגת סידן",
    "Strong prebiotic at low doses; well tolerated": "פרה-ביוטי חזק במינונים נמוכים; נסבל היטב",
    "Strong osmotic laxative; prebiotic; used for hepatic encephalopathy treatment": "משלשל אוסמוטי חזק; פרה-ביוטי; משמש לטיפול באנצפלופתיה כבדית",
    "Prebiotic effects; GI discomfort at high doses (>30g); slightly fruity/caramel taste": "השפעות פרה-ביוטיות; אי נוחות במערכת העיכול במינונים גבוהים (>30 גרם); טעם פירותי/קרמל קל",
    "Fully digestible disaccharide; slow release of glucose and fructose; non-cariogenic": "דיסכריד ניתן לעיכול מלא; שחרור איטי של גלוקוז ופרוקטוז; לא גורם עששת",
    "Some IMO partially digestible (higher calorie than claimed); prebiotic": "חלק מ-IMO ניתנים לעיכול חלקי (יותר קלוריות מהנטען); פרה-ביוטי",
    "Mixture of sorbitol, maltitol, and hydrogenated oligosaccharides; laxative effects at high doses": "תערובת סורביטול, מלטיטול ואוליגוסכרידים מוקשים; השפעות משלשלות במינונים גבוהים",
    "Same as sorbitol; laxative at high doses": "זהה לסורביטול; משלשל במינונים גבוהים",

    # EFSA/erythritol
    "EFSA lowered ADI to 0.5g/kg in 2023 due to laxative effects; Cleveland Clinic studies linked to cardiovascular events": "EFSA הוריד ADI ל-0.5 גרם/ק\"ג ב-2023 בשל השפעות משלשלות; מחקרי קליבלנד קליניק קשרו לאירועים קרדיווסקולריים",

    # Monk fruit
    "Primary sweet component of monk fruit; antioxidant properties reported": "הרכיב המתוק העיקרי בפרי הנזיר; דווח על תכונות נוגדות חמצון",

    # Traditional/whole food sugars
    "Traditional sweetener; caloric but contains iron and antioxidants": "ממתיק מסורתי; קלורי אך מכיל ברזל ונוגדי חמצון",
    "Traditional Mexican sweetener; cone-shaped blocks; same as panela": "ממתיק מקסיקני מסורתי; גושים בצורת חרוט; זהה לפנלה",
    "Traditional Asian sweetener; moderate GI; caloric": "ממתיק אסיאתי מסורתי; אינדקס גליקמי בינוני; קלורי",
    "Unrefined; retains minerals but still caloric; marketed as healthier sugar": "לא מזוקק; שומר על מינרלים אך עדיין קלורי; משווק כסוכר בריא יותר",
    "Unrefined sugar; contains minerals but still caloric and cariogenic": "סוכר לא מזוקק; מכיל מינרלים אך עדיין קלורי וגורם עששת",
    "Richest mineral source among sugars (iron, calcium, magnesium, potassium)": "מקור המינרלים העשיר ביותר בין הסוכרים (ברזל, סידן, מגנזיום, אשלגן)",
    "Rich in polyphenols and antioxidants; sweet-sour profile; lower GI than sugar": "עשיר בפוליפנולים ונוגדי חמצון; פרופיל מתוק-חמוץ; אינדקס גליקמי נמוך מסוכר",
    "Rich in iron; traditional Ayurvedic use; still caloric sugar": "עשיר בברזל; שימוש איורוודי מסורתי; עדיין סוכר קלורי",
    "Same as panela; unrefined whole cane sugar; retains minerals": "זהה לפנלה; סוכר קנה שלם לא מזוקק; שומר על מינרלים",
    "Same caloric/metabolic profile as sucrose; anti-crystallization properties": "אותו פרופיל קלורי/מטבולי כמו סוכרוז; תכונות נגד גיבוש",
    "Same as sucrose; ~20% of global sugar supply from sugar beets": "זהה לסוכרוז; ~20% מאספקת הסוכר העולמית מסלק סוכר",
    "Same as sucrose; contains anticaking cornstarch; rapidly dissolves": "זהה לסוכרוז; מכיל עמילן תירס נגד גיבוש; נמס במהירות",
    "Same as regular sugar, organic certified.": "זהה לסוכר רגיל, מאושר אורגני.",
    "Whole food sweetener; low GI; rich in beta-carotene": "ממתיק מזון שלם; אינדקס גליקמי נמוך; עשיר בבטא-קרוטן",
    "Whole food sweetener with fiber; still caloric": "ממתיק מזון שלם עם סיבים; עדיין קלורי",
    "White sugar with molasses added back. Slightly more minerals than white.": "סוכר לבן עם מולסה שהוחזרה. מעט יותר מינרלים מלבן.",
    "Sugar from sugarcane. Less processed than white sugar if raw/turbinado.": "סוכר מקני סוכר. פחות מעובד מסוכר לבן אם גולמי/טורבינדו.",

    # Thyroid
    "Thyroid function inhibition; hemolytic anemia; methemoglobinemia at high doses": "עיכוב תפקוד בלוטת התריס; אנמיה המוליטית; מתמוגלובינמיה במינונים גבוהים",
    "Thyroid function disruption; potential carcinogenicity (thyroid tumors in rats); genotoxicity (in vitro); neurotoxicity": "שיבוש תפקוד בלוטת התריס; חשש לסרטנות (גידולי תריס בחולדות); רעילות גנטית (במבחנה); רעילות עצבית",
    "Thyroid dysfunction (hyper/hypothyroidism); Thyroiditis; Goiter; Iodine-induced hyperthyroidism (Jod-Basedow)": "הפרעת בלוטת תריס (יתר/תת פעילות); דלקת בלוטת התריס; זפק; יתר פעילות תריס מושרית יוד (Jod-Basedow)",
    "Thyroid disruption; neurodevelopmental toxicity; endocrine disruption; hepatotoxicity": "שיבוש בלוטת התריס; רעילות נוירו-התפתחותית; שיבוש אנדוקריני; רעילות כבדית",

    # Toxicological
    "Toxic; historical sweetener banned due to safety concerns": "רעיל; ממתיק היסטורי שנאסר בשל חששות בטיחות",
    "Toxic; carcinogenic; historically used in medicines; now banned": "רעיל; מסרטן; שימש היסטורית ברפואה; כעת אסור",
    "Toxic at high doses; safe at food levels": "רעיל במינונים גבוהים; בטוח ברמות מזון",
    "Toxic at high doses; liver damage": "רעיל במינונים גבוהים; נזק לכבד",
    "Hepatotoxicity (liver damage); carcinogenic; banned since 1950 in US": "רעילות כבדית (נזק לכבד); מסרטן; אסור מאז 1950 בארה\"ב",
    "Tin accumulation concerns at high doses": "חששות הצטברות בדיל במינונים גבוהים",
    "Retinal deposits at high doses": "משקעים ברשתית במינונים גבוהים",
    "Respiratory irritation; cytotoxicity; potential genotoxicity": "גירוי נשימתי; רעילות תאית; חשש לרעילות גנטית",
    "Suspected teratogenicity; organ penetration; low ADI": "חשד לטרטוגניות; חדירה לאיברים; ADI נמוך",
    "Synergistic neurotoxicity with Brilliant Blue (46% cell reduction vs expected 16%); obesity/metabolic links": "רעילות עצבית סינרגיסטית עם כחול מבריק (46% הפחתת תאים לעומת 16% צפוי); קשרים לשמנות/מטבוליזם",

    # Sulfite
    "Sulfite sensitivity; asthma exacerbation": "רגישות לסולפיטים; החמרת אסתמה",
    "Same sulfite sensitivity; must declare as allergen above 10ppm": "אותה רגישות לסולפיטים; חייב להצהיר כאלרגן מעל 10ppm",

    # Nitrosamine/nitrite
    "Same nitrosamine concerns; colorectal/stomach cancer": "אותם חששות ניטרוזאמין; סרטן מעי גס/קיבה",

    # MSG/glutamates
    "Same concerns as glutamates group": "אותם חששות כקבוצת הגלוטמטים",
    "Same concerns as glutamates group; magnesium intake": "אותם חששות כקבוצת הגלוטמטים; צריכת מגנזיום",
    "Same concerns as MSG; potassium intake consideration": "אותם חששות כמו MSG; שיקול צריכת אשלגן",
    "Used with MSG; concerns for gout/uric acid; banned in infant foods": "משמש עם MSG; חששות לשיגדון/חומצת שתן; אסור במזון תינוקות",
    "Same as E627; gout trigger; not permitted in infant foods": "זהה ל-E627; מעורר שיגדון; לא מותר במזון תינוקות",
    "Used with nitrite to inhibit nitrosamines; headaches in sensitive": "משמש עם ניטריט לעיכוב ניטרוזאמינים; כאבי ראש ברגישים",

    # Caffeine
    "Same as caffeine plus tannin-related GI effects": "זהה לקפאין בתוספת השפעות טאנין על מערכת העיכול",
    "Same as caffeine but potentially slower onset": "זהה לקפאין אך עם תחילת פעולה איטית יותר",
    "Same as caffeine anhydrous": "זהה לקפאין אנהידרוס",
    "Well-tolerated; does not appear to affect heart rate/BP as much as caffeine": "נסבל היטב; לא נראה משפיע על דופק/לחץ דם כמו קפאין",
    "Tachycardia, cardiac arrhythmia": "טכיקרדיה, הפרעות קצב לב",

    # "See X" patterns
    "See individual components": "ראה רכיבים בודדים",
    "See Zinc; GI upset at higher doses": "ראה אבץ; הפרעה במערכת העיכול במינונים גבוהים",
    "See Vitamin D (higher potency means narrower safety margin)": "ראה ויטמין D (עוצמה גבוהה יותר = מרווח בטיחות צר יותר)",
    "See Vitamin C; Sodium contribution at high doses": "ראה ויטמין C; תרומת נתרן במינונים גבוהים",
    "See Vitamin C; Also provides potassium": "ראה ויטמין C; מספק גם אשלגן",
    "See Vitamin C; Also provides calcium (~10% by weight)": "ראה ויטמין C; מספק גם סידן (~10% ממשקל)",
    "See Vitamin C; Account for magnesium content": "ראה ויטמין C; יש לקחת בחשבון תכולת מגנזיום",
    "See Vitamin C and Zinc": "ראה ויטמין C ואבץ",
    "See Vitamin C": "ראה ויטמין C",
    "See Vitamin B6; Neuropathy at chronic high doses": "ראה ויטמין B6; נוירופתיה במינונים גבוהים כרוניים",
    "See Vitamin B5; Occasional GI effects": "ראה ויטמין B5; השפעות מערכת העיכול מדי פעם",
    "See Vitamin B2": "ראה ויטמין B2",
    "See Selenium; Longer tissue retention than inorganic forms": "ראה סלניום; שמירה ארוכה יותר ברקמות מצורות אי-אורגניות",
    "See Omega-3 EPA; Fishy odor; GI upset; Prolonged bleeding": "ראה אומגה-3 EPA; ריח דגים; הפרעה במערכת העיכול; דימום ממושך",
    "See Magnesium; Less likely to cause diarrhea": "ראה מגנזיום; פחות סיכוי לגרום שלשול",
    "See Magnesium; Laxative effect at higher doses": "ראה מגנזיום; אפקט משלשל במינונים גבוהים",
    "See Magnesium; Common laxative effect": "ראה מגנזיום; אפקט משלשל נפוץ",
    "See Iron; Similar GI effects to ferrous sulfate": "ראה ברזל; השפעות מערכת עיכול דומות לסולפט ברזלי",
    "See Iron; Minimal GI effects": "ראה ברזל; השפעות מינימליות על מערכת העיכול",
    "See Iron; Generally better tolerated": "ראה ברזל; נסבל טוב יותר בדרך כלל",
    "See Iron; GI side effects less than ferrous sulfate": "ראה ברזל; תופעות לוואי במערכת העיכול פחות מסולפט ברזלי",
    "See Iron; GI distress common (constipation, nausea, black stools)": "ראה ברזל; מצוקת מערכת עיכול נפוצה (עצירות, בחילה, צואה שחורה)",
    "See E171; genotoxicity concerns": "ראה E171; חששות לרעילות גנטית",
    "See E120; allergen concern": "ראה E120; חשש אלרגן",
    "See Copper; GI irritation at high doses": "ראה נחושת; גירוי מערכת העיכול במינונים גבוהים",
    "Similar concerns as carrageenan": "חששות דומים לקרגינן",

    # Food descriptions
    "Whole food. Major allergen (casein, whey). Source of calcium, protein.": "מזון שלם. אלרגן מרכזי (קזאין, מי גבינה). מקור לסידן, חלבון.",
    "Whole food seasoning. Contains allicin. Potential antimicrobial properties.": "תיבול מזון שלם. מכיל אליצין. תכונות אנטי-מיקרוביאליות פוטנציאליות.",
    "Vinegar made from distilled alcohol. 5% acetic acid. Very pure.": "חומץ מאלכוהול מזוקק. 5% חומצה אצטית. טהור מאוד.",
    "Tropical oil high in saturated fat. Sustainability concerns (deforestation).": "שמן טרופי עשיר בשומן רווי. חששות קיימות (כריתת יערות).",
    "Tree nut. Major allergen. Also a skin irritant (urushiol in shell).": "אגוז עץ. אלרגן מרכזי. גם מגרה עור (אורושיול בקליפה).",
    "Tree nut allergen. High in monounsaturated fat.": "אלרגן אגוז עץ. עשיר בשומן חד בלתי רווי.",
    "Tree nut allergen. Good source of vitamin E, healthy fats.": "אלרגן אגוז עץ. מקור טוב לוויטמין E, שומנים בריאים.",
    "Root vegetable. High in beta-carotene. Common allergen in some regions.": "ירק שורש. עשיר בבטא-קרוטן. אלרגן נפוץ באזורים מסוימים.",
    "Rhizome spice. Anti-nausea properties. Common in Asian cuisine.": "תבלין שורשי. תכונות נגד בחילה. נפוץ במטבח האסיאתי.",
    "Starch from wheat. May contain trace gluten. Used in Asian noodles.": "עמילן מחיטה. עלול להכיל עקבות גלוטן. משמש באטריות אסיאתיות.",
    "Starch from corn. Common thickener. Gluten-free.": "עמילן מתירס. מעבה נפוץ. ללא גלוטן.",
    "Staple grain. Gluten-free. Arsenic concerns in some varieties.": "דגן עיקרי. ללא גלוטן. חששות ארסן בחלק מהזנים.",
    "Standard processed milk; allergen for lactose intolerant": "חלב מעובד רגיל; אלרגן לסובלים מאי סבילות ללקטוז",
    "Same as nonfat milk. Dairy allergen.": "זהה לחלב דל שומן. אלרגן חלבי.",
    "Same as Dehydrated Garlic.": "זהה לשום מיובש.",
    "Same as Natural Flavor. Singular form.": "זהה לטעם טבעי. צורת יחיד.",

    # Drug interactions
    "Weight gain (water retention), GI discomfort at high doses, anecdotal muscle cramps": "עלייה במשקל (אגירת מים), אי נוחות במערכת העיכול במינונים גבוהים, התכווצויות שרירים אנקדוטליות",
    "Soy allergy concerns; generally safe": "חששות אלרגיה לסויה; בטוח בדרך כלל",
    "Scombroid fish poisoning (flushing, headache, GI distress); allergic-like reactions; hypotension": "הרעלת דגים סקומברואידית (סמקה, כאב ראש, מצוקת מערכת עיכול); תגובות דמויות אלרגיה; לחץ דם נמוך",

    # Very rare/limited data
    "Very rare: acne at high doses": "נדיר מאוד: אקנה במינונים גבוהים",
    "Very limited safety data; potential hepatic concerns": "נתוני בטיחות מוגבלים מאוד; חששות כבדיים פוטנציאליים",
    "Very limited data; not commercially developed": "נתונים מוגבלים מאוד; לא פותח מסחרית",
    "Some data gaps; generally safe at ADI; antiviral potential noted": "פערי נתונים מסוימים; בטוח בדרך כלל ב-ADI; פוטנציאל אנטי-ויראלי צוין",
    "Traditional medicinal use; antioxidant; anti-inflammatory properties reported": "שימוש רפואי מסורתי; נוגד חמצון; דווח על תכונות אנטי-דלקתיות",

    # Toxin patterns
    "Similar to T-2: hematotoxicity; immunotoxicity": "דומה ל-T-2: רעילות המטולוגית; רעילות חיסונית",
    "Similar to Fumonisin B1; hepatotoxicity; nephrotoxicity": "דומה ל-Fumonisin B1; רעילות כבדית; רעילות כלייתית",
    "Similar to DMAA: cardiovascular risks": "דומה ל-DMAA: סיכונים קרדיווסקולריים",
    "Same as DON: GI toxicity; immunotoxicity": "זהה ל-DON: רעילות מערכת עיכול; רעילות חיסונית",

    # Whey/milk
    "Same as whey; less lactose than WPC": "זהה למי גבינה; פחות לקטוז מ-WPC",

    # Miscellaneous
    "Hyperactivity in children; allergic reactions; chromosomal damage in animal studies": "היפראקטיביות בילדים; תגובות אלרגיות; נזק כרומוזומלי במחקרי בעלי חיים",
    "None at recommended doses": "אין בחשיפה למינונים מומלצים",
}

def escape_sql(text):
    return text.replace("'", "''")

def main():
    sql_lines = []
    for eng, heb in DIRECT.items():
        eng_escaped = escape_sql(eng)
        heb_escaped = escape_sql(heb)
        sql_lines.append(f"UPDATE food_additives SET health_concerns_he = '{heb_escaped}' WHERE health_concerns = '{eng_escaped}';")

    sql_dir = os.path.join(os.path.dirname(__file__), "sql")
    os.makedirs(sql_dir, exist_ok=True)
    sql_path = os.path.join(sql_dir, "health_concerns_he_batch6.sql")
    with open(sql_path, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines))
    print(f"Written {len(sql_lines)} UPDATE statements to {sql_path}")

if __name__ == "__main__":
    main()
