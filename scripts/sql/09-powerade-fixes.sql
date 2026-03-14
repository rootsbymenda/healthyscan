-- Powerade missing aliases & fixes
-- מלח לימון = citric acid
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('מלח לימון', 'citric acid');
-- תלת-אשלגן ציטראט = tripotassium citrate (E332)
INSERT INTO food_additives (common_name, hebrew_name, e_number, category, category_he, function_desc, safety_score) SELECT 'Tripotassium Citrate', 'תלת-אשלגן ציטראט', 'E332', 'acidity_regulator', 'מווסת חומציות', 'Acidity regulator, stabilizer', 75 WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'tripotassium citrate');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('תלת-אשלגן ציטראט', 'tripotassium citrate');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('תלת אשלגן ציטראט', 'tripotassium citrate');
-- אספרטיים = aspartame (E951)
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אספרטיים', 'aspartame');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אספרטם', 'aspartame');
-- אססולפאם K = acesulfame potassium (E950)
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אססולפאם k', 'acesulfame potassium');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אצסולפם k', 'acesulfame potassium');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אססולפם k', 'acesulfame potassium');
-- ויטמין B variants
INSERT INTO food_additives (common_name, hebrew_name, category, category_he, function_desc, safety_score) SELECT 'Vitamin B', 'ויטמין B', 'vitamin', 'ויטמין', 'Vitamin, nutritional supplement', 90 WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE LOWER(common_name) = 'vitamin b');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('ויטמין b', 'vitamin b');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('ויטמין b6', 'vitamin b6');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('ויטמין b12', 'vitamin b12');
-- Fix fructose category (was incorrectly 'Preservative' in some entries)
UPDATE food_additives SET category = 'sweetener_natural', category_he = 'ממתיק טבעי' WHERE LOWER(common_name) = 'fructose';
-- Add category_he for common categories that are missing it
UPDATE food_additives SET category_he = 'מרכיב בסיסי' WHERE category = 'base_ingredient' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'חומר משמר' WHERE category = 'preservative' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'מייצב' WHERE category = 'stabilizer' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'מווסת חומציות' WHERE category = 'acidity_regulator' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'מתחלב' WHERE category = 'emulsifier' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'מעבה' WHERE category = 'thickener' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'צבע מאכל' WHERE category = 'colorant' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'נוגד חמצון' WHERE category = 'antioxidant' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'חומר טעם' WHERE LOWER(category) = 'flavoring' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'ממתיק מלאכותי' WHERE category = 'sweetener_artificial' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'ממתיק טבעי' WHERE category = 'sweetener_natural' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'ממתיק' WHERE category = 'sweetener' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'שמנים ושומנים' WHERE category = 'oils_fats' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'חלבון' WHERE category = 'protein' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'עמילן' WHERE category = 'starch' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'סוכר' WHERE category = 'sugar' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'בשר' WHERE category = 'meat' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'מוצר חלב' WHERE category = 'dairy' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'חומצת מזון' WHERE category = 'food_acid' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'מגבר טעם' WHERE category = 'flavor_enhancer' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'חלבון צמחי' WHERE category = 'plant_proteins' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'מלח' WHERE category = 'salt' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'תבלין' WHERE category = 'spice' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'ויטמין' WHERE category = 'vitamin' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'מינרל' WHERE category = 'mineral' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'סיב תזונתי' WHERE category = 'fiber' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'גומי' WHERE category = 'gum' AND (category_he IS NULL OR category_he = '');
