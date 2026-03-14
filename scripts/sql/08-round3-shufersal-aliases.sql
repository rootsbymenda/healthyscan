-- Round 3: Hebrew food aliases from Shufersal ingredient mining
-- Based on 5,433 scraped products, 1,296 unique ingredients
-- Focus: top unmatched Hebrew ingredient names

-- ============================================================
-- Part 1: New food_additives entries for common food ingredients
-- ============================================================

-- Gums & Thickeners
INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Guar gum', 'גואר גאם', 'thickener', 'מעבה', 80, 'Generally safe; may cause digestive discomfort in large amounts'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'guar gum');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Locust bean gum', 'גאם גרעיני חרובים', 'thickener', 'מעבה', 82, 'Natural thickener from carob seeds; generally safe'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'locust bean gum');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Carrageenan', 'קרגינן', 'thickener', 'מעבה', 65, 'Controversial additive; some studies link to inflammation'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'carrageenan');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Gum arabic', 'גאם ערביק', 'thickener', 'מעבה', 85, 'Natural gum from acacia tree; generally safe'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'gum arabic');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Xanthan gum', 'קסנטן גאם', 'thickener', 'מעבה', 80, 'Common thickener; generally safe in food amounts'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'xanthan gum');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Tapioca starch', 'עמילן טפיוקה', 'thickener', 'מעבה', 85, 'Natural starch from cassava; generally safe'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'tapioca starch');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Vegetable starch', 'עמילן צמחי', 'thickener', 'מעבה', 85, 'Plant-derived starch; generally safe'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'vegetable starch');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Partially hydrolyzed starch', 'עמילן מפורק חלקית', 'thickener', 'מעבה', 75, 'Processed starch; raises glycemic index faster than regular starch'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'partially hydrolyzed starch');

-- Dietary components
INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Dietary fiber', 'סיבים תזונתיים', 'fiber', 'סיבים', 92, 'Beneficial for digestion and heart health'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'dietary fiber');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Sugars', 'סוכרים', 'sweetener', 'ממתיק', 50, 'General term for sugars; excessive intake linked to obesity and diabetes'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'sugars');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Fructose syrup', 'סירופ פרוקטוז', 'sweetener', 'ממתיק', 40, 'Concentrated sugar; excessive consumption linked to fatty liver and metabolic issues'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'fructose syrup');

-- Fats
INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Chicken fat', 'שומן עוף', 'oils_fats', 'שומן/שמן', 70, 'Animal fat; contains saturated fat'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'chicken fat');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Turkey fat', 'שומן הודו', 'oils_fats', 'שומן/שמן', 70, 'Animal fat; contains saturated fat'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'turkey fat');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Vegetable fat', 'שומן צמחי', 'oils_fats', 'שומן/שמן', 65, 'Plant-derived fat; may contain palm oil or hydrogenated fats'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'vegetable fat');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Shortening', 'שומן קונדיטורי', 'oils_fats', 'שומן/שמן', 55, 'May contain trans fats; high in saturated fat'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'shortening');

-- Dairy
INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Pasteurized milk', 'חלב מפוסטר', 'dairy', 'מוצר חלב', 85, 'Standard processed milk; allergen for lactose intolerant'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'pasteurized milk');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Milk components', 'רכיבי חלב', 'dairy', 'מוצר חלב', 80, 'General dairy ingredients; contains allergens'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'milk components');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Skim milk powder', 'אבקת חלב כחוש', 'dairy', 'מוצר חלב', 80, 'Low-fat dried milk; contains dairy allergens'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'skim milk powder');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Whey powder', 'אבקת מי גבינה', 'dairy', 'מוצר חלב', 80, 'Dried whey; contains dairy allergens'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'whey powder');

-- Extracts
INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Rosemary extract', 'מיצוי רוזמרין', 'antioxidant', 'נוגד חמצון', 85, 'Natural antioxidant from rosemary; generally safe'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'rosemary extract');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Mushroom extract', 'מיצוי פטריות', 'flavor', 'חומר טעם', 85, 'Natural flavoring; generally safe'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'mushroom extract');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Fermented onion extract', 'תמצית בצל מותסס', 'flavor', 'חומר טעם', 82, 'Natural flavoring; generally safe'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'fermented onion extract');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Paprika extract', 'תמצית פפריקה', 'colorant', 'צבע מאכל', 85, 'Natural food coloring from paprika; generally safe'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'paprika extract');

-- Proteins
INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Vegetable protein', 'חלבון צמחי', 'protein', 'חלבון', 82, 'Plant-derived protein; may contain soy allergen'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'vegetable protein');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Hydrolyzed vegetable protein', 'הידרוליזט חלבון צמחי', 'flavor', 'חומר טעם', 65, 'Flavor enhancer; may contain MSG-like compounds'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'hydrolyzed vegetable protein');

-- Vegetables & fruits
INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Carrot', 'גזר', 'basic_ingredient', 'מרכיב בסיסי', 92, 'Healthy vegetable; rich in beta-carotene'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'carrot');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Tomato concentrate', 'רכז עגבניות', 'basic_ingredient', 'מרכיב בסיסי', 82, 'Concentrated tomato; rich in lycopene'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'tomato concentrate');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Lemon', 'לימון', 'basic_ingredient', 'מרכיב בסיסי', 92, 'Natural citrus fruit; rich in vitamin C'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'lemon');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Apple', 'תפוח', 'basic_ingredient', 'מרכיב בסיסי', 92, 'Healthy fruit; rich in fiber and vitamins'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'apple');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Celery', 'סלרי', 'basic_ingredient', 'מרכיב בסיסי', 90, 'Healthy vegetable; common allergen in some regions'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'celery');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Parsley', 'פטרוזיליה', 'basic_ingredient', 'מרכיב בסיסי', 92, 'Herb; rich in vitamins K and C'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'parsley');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Dill', 'שמיר', 'basic_ingredient', 'מרכיב בסיסי', 92, 'Herb; generally safe'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'dill');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Mustard', 'חרדל', 'spice', 'תבלין', 85, 'Common condiment; allergen for some people'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'mustard');

-- Acids & regulators
INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Citric acid', 'חומצת לימון', 'acidity_regulator', 'מווסת חומציות', 82, 'Common natural acid; generally safe'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'citric acid');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Sodium citrate', 'סודיום ציטרט', 'acidity_regulator', 'מווסת חומציות', 80, 'Acidity regulator; generally safe in food amounts'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'sodium citrate');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Trisodium citrate', 'טרי סודיום ציטראט', 'acidity_regulator', 'מווסת חומציות', 80, 'Acidity regulator and emulsifier; generally safe'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'trisodium citrate');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Carbon dioxide', 'פחמן דו חמצני', 'processing_aid', 'חומר עיבוד', 90, 'Used for carbonation; generally safe'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'carbon dioxide');

-- Meat products
INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Turkey breast', 'חזה הודו', 'basic_ingredient', 'מרכיב בסיסי', 85, 'Lean protein source'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'turkey breast');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Chicken breast', 'חזה עוף', 'basic_ingredient', 'מרכיב בסיסי', 85, 'Lean protein source'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'chicken breast');

-- Other
INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Rice flour', 'קמח אורז', 'grain', 'דגן', 85, 'Gluten-free flour; generally safe'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'rice flour');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Taurine', 'טאורין', 'supplement', 'תוסף', 75, 'Amino acid; generally safe in moderate amounts; common in energy drinks'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'taurine');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Trehalose', 'טרהלוז', 'sweetener', 'ממתיק', 70, 'Natural sugar; some concerns about promoting C. difficile virulence'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'trehalose');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Glycerol', 'גליצרול', 'humectant', 'לחותן', 80, 'Common food additive; generally safe'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'glycerol');

-- ============================================================
-- Part 2: Hebrew aliases → English canonical names
-- ============================================================

-- Gums (multiple spellings)
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('גואר גאם', 'guar gum');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('גואר גם', 'guar gum');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('גם גואר', 'guar gum');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('גאם גרעיני חרובים', 'locust bean gum');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('לוקוסט בין גאם', 'locust bean gum');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('קרגנן', 'carrageenan');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('קרגינן', 'carrageenan');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('קראגינן', 'carrageenan');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('גאם ערביק', 'gum arabic');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('קסנטן גאם', 'xanthan gum');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('גאם קסנטן', 'xanthan gum');

-- Starches
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('עמילן צמחי', 'vegetable starch');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('עמילן טפיוקה', 'tapioca starch');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('עמילן מפורק חלקית', 'partially hydrolyzed starch');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('עמילן מעובד', 'modified starch');

-- Sugars
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('סוכרים', 'sugars');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('סירופ פרוקטוז', 'fructose syrup');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('סירופ גלוקוזה', 'glucose syrup');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('סוכר לבן', 'sugar');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('טרהלוז', 'trehalose');

-- Dietary
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('סיבים תזונתיים', 'dietary fiber');

-- Fats
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שומן עוף', 'chicken fat');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שומן הודו', 'turkey fat');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שומן עוף והודו', 'chicken fat');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שומן צמחי', 'vegetable fat');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שמן דקלים', 'palm oil');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שומן קונדיטורי', 'shortening');

-- Dairy
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חלב מפוסטר', 'pasteurized milk');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('רכיבי חלב', 'milk components');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אבקת חלב כחוש', 'skim milk powder');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אבקת חלב רזה', 'skim milk powder');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אבקת מי גבינה', 'whey powder');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חלב טרי', 'milk');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חלב נוזלי', 'milk');

-- Extracts
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('מיצוי רוזמרין', 'rosemary extract');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('תמצית רוזמרין', 'rosemary extract');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('מיצוי פטריות', 'mushroom extract');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('תמצית פטריות', 'mushroom extract');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('תמצית בצל מותסס', 'fermented onion extract');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('מיצוי בצל מותסס', 'fermented onion extract');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('תמצית פפריקה', 'paprika extract');

-- Proteins
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חלבון צמחי', 'vegetable protein');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('הידרוליזט חלבון צמחי', 'hydrolyzed vegetable protein');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חלבון סויה', 'soy protein');

-- Emulsifiers (Hebrew descriptions)
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חומר מתחלב לציטין סויה', 'soy lecithin');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חומר מתחלב', 'emulsifier');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חומרי טעם', 'flavorings');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חומר טעם וריח', 'flavorings');

-- Preservatives (Hebrew descriptions)
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חומר משמר', 'preservative');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חומרי שימור', 'preservative');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('פוטסיום סורבט', 'potassium sorbate');

-- Acidity regulators (Hebrew descriptions)
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חומצת לימון', 'citric acid');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חומצת מאכל', 'food acid');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חומר מווסת חומציות', 'acidity regulator');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('מווסת חומציות', 'acidity regulator');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('מווסתי חומציות', 'acidity regulator');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חומר מווסת חומציות חומצת לימון', 'citric acid');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('סודיום ציטרט', 'sodium citrate');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('טרי סודיום ציטראט', 'trisodium citrate');

-- Stabilizers (Hebrew descriptions)
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חומרים מייצבים', 'stabilizers');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('מייצבים', 'stabilizers');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חומרים מייצבים ומתחלבים', 'stabilizers');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('מסמיך', 'thickener');

-- Colorants
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('צבע מאכל', 'food coloring');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('כורכומין', 'curcumin');

-- Antioxidants
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('מעכבי חימצון', 'antioxidants');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('נוגד חמצון', 'antioxidant');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('נוגדי חמצון', 'antioxidants');

-- Vegetables & herbs
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('גזר', 'carrot');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('רכז עגבניות', 'tomato concentrate');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('לימון', 'lemon');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('תפוח', 'apple');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('סלרי', 'celery');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('פטרוזיליה', 'parsley');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שמיר', 'dill');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חרדל', 'mustard');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('כוסברה', 'coriander');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('זנגביל', 'ginger');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('נענע', 'mint');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אורגנו', 'oregano');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('בזיליקום', 'basil');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('רוזמרין', 'rosemary');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('טימין', 'thyme');

-- Meat products
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חזה הודו', 'turkey breast');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חזה עוף', 'chicken breast');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('בשר עוף', 'chicken');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('בשר הודו', 'turkey');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('בשר בקר', 'beef');

-- Other
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('פחמן דו חמצני', 'carbon dioxide');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('קמח אורז', 'rice flour');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('טאורין', 'taurine');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('גליצרול', 'glycerol');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('גליצרין', 'glycerol');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('מלח שולחן', 'salt');

-- Generic category aliases (map Hebrew functional descriptions to generic entries)
INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Stabilizers', 'חומרים מייצבים', 'stabilizer', 'מייצב', 75, 'General stabilizer category; safety depends on specific compound'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'stabilizers');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Emulsifier', 'חומר מתחלב', 'emulsifier', 'מתחלב', 75, 'General emulsifier category; safety depends on specific compound'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'emulsifier');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Preservative', 'חומר משמר', 'preservative', 'חומר משמר', 70, 'General preservative category; safety depends on specific compound'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'preservative');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Acidity regulator', 'מווסת חומציות', 'acidity_regulator', 'מווסת חומציות', 80, 'General acidity regulator; usually safe food acids'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'acidity regulator');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Food coloring', 'צבע מאכל', 'colorant', 'צבע מאכל', 65, 'General food coloring; some artificial colors linked to hyperactivity'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'food coloring');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Antioxidants', 'נוגדי חמצון', 'antioxidant', 'נוגד חמצון', 80, 'General antioxidant category; most are safe'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'antioxidants');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Thickener', 'מסמיך', 'thickener', 'מעבה', 78, 'General thickener category; safety depends on specific compound'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'thickener');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Food acid', 'חומצת מאכל', 'acidity_regulator', 'מווסת חומציות', 80, 'General food acid; usually citric or lactic acid'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'food acid');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Soy protein', 'חלבון סויה', 'protein', 'חלבון', 78, 'Plant protein; major allergen'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'soy protein');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Potassium sorbate', 'פוטסיום סורבט', 'preservative', 'חומר משמר', 75, 'Common preservative; generally safe in permitted amounts'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'potassium sorbate');

INSERT INTO food_additives (e_number, common_name, hebrew_name, category, category_he, safety_score, health_concerns)
SELECT 'N/A', 'Curcumin', 'כורכומין', 'colorant', 'צבע מאכל', 88, 'Natural yellow coloring from turmeric; anti-inflammatory properties'
WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'curcumin');

-- Also update hebrew_name on existing entries that may have E-numbers
UPDATE food_additives SET hebrew_name = 'גואר גאם', category_he = 'מעבה' WHERE e_number = 'E412' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'גאם גרעיני חרובים', category_he = 'מעבה' WHERE e_number = 'E410' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'קרגינן', category_he = 'מעבה' WHERE e_number = 'E407' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'גאם ערביק', category_he = 'מעבה' WHERE e_number = 'E414' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'קסנטן גאם', category_he = 'מעבה' WHERE e_number = 'E415' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'חומצת לימון', category_he = 'מווסת חומציות' WHERE e_number = 'E330' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'כורכומין', category_he = 'צבע מאכל' WHERE e_number = 'E100' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'פוטסיום סורבט', category_he = 'חומר משמר' WHERE e_number = 'E202' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'סודיום ניטריט', category_he = 'חומר משמר' WHERE e_number = 'E250' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'גליצרול', category_he = 'לחותן' WHERE e_number = 'E422' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'סודיום ציטרט', category_he = 'מווסת חומציות' WHERE e_number = 'E331' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'תמצית פפריקה', category_he = 'צבע מאכל' WHERE e_number = 'E160c' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'מיצוי רוזמרין', category_he = 'נוגד חמצון' WHERE e_number = 'E392' AND (hebrew_name IS NULL OR hebrew_name = '');
