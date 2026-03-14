-- Hebrew Food Aliases + Basic Food Ingredients
-- Source: Hazi Hinam ingredient analysis (March 10, 2026)
-- Purpose: Fix "לא במאגר" for common Hebrew food ingredients
--
-- Two parts:
-- 1. Basic food ingredients → food_additives (with safe scores)
-- 2. Hebrew aliases → food_aliases (Hebrew → English canonical)

-- ════════════════════════════════════════════════════════════════
-- PART 1: Basic food ingredients in food_additives
-- These are whole foods / basic ingredients, NOT E-number additives.
-- health_concerns = 'Generally recognized as safe' → score 85
-- ════════════════════════════════════════════════════════════════

-- ── Basics ──
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Salt', 'Basic ingredient', 'מלח', 'מרכיב בסיסי', 'Generally recognized as safe. Excessive consumption linked to hypertension.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Salt' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Sugar', 'Sweetener', 'סוכר', 'ממתיק', 'Generally recognized as safe. Excessive consumption linked to obesity and diabetes.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Sugar' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Water', 'Basic ingredient', 'מים', 'מרכיב בסיסי', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Water' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'White sugar', 'Sweetener', 'סוכר לבן', 'ממתיק', 'Generally recognized as safe. Excessive consumption linked to obesity and diabetes.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'White sugar' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Table salt', 'Basic ingredient', 'מלח שולחן', 'מרכיב בסיסי', 'Generally recognized as safe. Excessive consumption linked to hypertension.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Table salt' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Flavoring agents', 'Flavoring', 'חומרי טעם וריח', 'חומר טעם', 'Generally recognized as safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Flavoring agents' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Natural flavoring agents', 'Flavoring', 'חומרי טעם וריח טבעיים', 'חומר טעם', 'Generally recognized as safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Natural flavoring agents' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Spices', 'Basic ingredient', 'תבלינים', 'מרכיב בסיסי', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Spices' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Yeast', 'Basic ingredient', 'שמרים', 'מרכיב בסיסי', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Yeast' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Yeast extract', 'Flavoring', 'תמצית שמרים', 'חומר טעם', 'Generally recognized as safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Yeast extract' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Caffeine', 'Stimulant', 'קפאין', 'ממריץ', 'Safe in moderate amounts. Limit for children and pregnant women.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Caffeine' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns, children_safe) SELECT 'Carbon dioxide', 'Processing aid', 'פחמן דו-חמצני', 'חומר עיבוד', 'Safe', 'Yes' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Carbon dioxide' COLLATE NOCASE);

-- ── Chocolate / Cocoa ──
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Cocoa butter', 'Fat/Oil', 'חמאת קקאו', 'שומן/שמן', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Cocoa butter' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Cocoa paste', 'Basic ingredient', 'עיסת קקאו', 'מרכיב בסיסי', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Cocoa paste' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Cocoa mass', 'Basic ingredient', 'מסת קקאו', 'מרכיב בסיסי', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Cocoa mass' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Cocoa powder', 'Basic ingredient', 'אבקת קקאו', 'מרכיב בסיסי', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Cocoa powder' COLLATE NOCASE);

-- ── Oils & Fats ──
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Vegetable oil', 'Fat/Oil', 'שמן צמחי', 'שומן/שמן', 'Generally recognized as safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Vegetable oil' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Sunflower oil', 'Fat/Oil', 'שמן חמניות', 'שומן/שמן', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Sunflower oil' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Palm oil', 'Fat/Oil', 'שמן דקל', 'שומן/שמן', 'Generally recognized as safe. Environmental concerns.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Palm oil' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Canola oil', 'Fat/Oil', 'שמן קנולה', 'שומן/שמן', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Canola oil' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Olive oil', 'Fat/Oil', 'שמן זית', 'שומן/שמן', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Olive oil' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Coconut oil', 'Fat/Oil', 'שמן קוקוס', 'שומן/שמן', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Coconut oil' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Soybean oil', 'Fat/Oil', 'שמן סויה', 'שומן/שמן', 'Safe. Allergen: soy.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Soybean oil' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Corn oil', 'Fat/Oil', 'שמן תירס', 'שומן/שמן', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Corn oil' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Vegetable oils and fats', 'Fat/Oil', 'שמנים ושומנים מהצומח', 'שומן/שמן', 'Generally recognized as safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Vegetable oils and fats' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Milk fat', 'Fat/Oil', 'שומן חלב', 'שומן/שמן', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Milk fat' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Butter', 'Fat/Oil', 'חמאה', 'שומן/שמן', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Butter' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Margarine', 'Fat/Oil', 'מרגרינה', 'שומן/שמן', 'Generally recognized as safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Margarine' COLLATE NOCASE);

-- ── Dairy ──
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Milk powder', 'Dairy', 'אבקת חלב', 'מוצר חלב', 'Safe. Allergen: milk.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Milk powder' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Skim milk powder', 'Dairy', 'אבקת חלב כחוש', 'מוצר חלב', 'Safe. Allergen: milk.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Skim milk powder' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Whole milk powder', 'Dairy', 'אבקת חלב מלא', 'מוצר חלב', 'Safe. Allergen: milk.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Whole milk powder' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Low-fat milk powder', 'Dairy', 'אבקת חלב דלת שומן', 'מוצר חלב', 'Safe. Allergen: milk.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Low-fat milk powder' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Non-fat milk powder', 'Dairy', 'אבקת חלב רזה', 'מוצר חלב', 'Safe. Allergen: milk.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Non-fat milk powder' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Whey powder', 'Dairy', 'אבקת מי גבינה', 'מוצר חלב', 'Safe. Allergen: milk.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Whey powder' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Milk', 'Dairy', 'חלב', 'מוצר חלב', 'Safe. Allergen: milk.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Milk' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Cream', 'Dairy', 'שמנת', 'מוצר חלב', 'Safe. Allergen: milk.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Cream' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Lactose', 'Dairy', 'לקטוז', 'מוצר חלב', 'Safe. May cause intolerance in lactose-sensitive individuals.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Lactose' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Whey', 'Dairy', 'מי גבינה', 'מוצר חלב', 'Safe. Allergen: milk.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Whey' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Casein', 'Dairy', 'קזאין', 'מוצר חלב', 'Safe. Allergen: milk.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Casein' COLLATE NOCASE);

-- ── Sugars & Sweeteners ──
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Fructose', 'Sweetener', 'פרוקטוז', 'ממתיק', 'Generally recognized as safe. Excessive consumption may affect liver metabolism.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Fructose' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Fruit sugar', 'Sweetener', 'סוכר פירות', 'ממתיק', 'Generally recognized as safe. Excessive consumption may affect liver metabolism.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Fruit sugar' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Glucose syrup', 'Sweetener', 'סירופ גלוקוז', 'ממתיק', 'Generally recognized as safe. High glycemic index.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Glucose syrup' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Dextrose', 'Sweetener', 'דקסטרוז', 'ממתיק', 'Generally recognized as safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Dextrose' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Maltodextrin', 'Sweetener', 'מלטודקסטרין', 'ממתיק', 'Generally recognized as safe. High glycemic index.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Maltodextrin' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Glucose', 'Sweetener', 'גלוקוז', 'ממתיק', 'Generally recognized as safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Glucose' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Sucrose', 'Sweetener', 'סוכרוז', 'ממתיק', 'Generally recognized as safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Sucrose' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Honey', 'Sweetener', 'דבש', 'ממתיק', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Honey' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Corn syrup', 'Sweetener', 'סירופ תירס', 'ממתיק', 'Generally recognized as safe. High glycemic index.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Corn syrup' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Glucose-fructose syrup', 'Sweetener', 'סירופ גלוקוז-פרוקטוז', 'ממתיק', 'Generally recognized as safe. Excessive consumption linked to obesity.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Glucose-fructose syrup' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Invert sugar', 'Sweetener', 'סוכר אינוורט', 'ממתיק', 'Generally recognized as safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Invert sugar' COLLATE NOCASE);

-- ── Grains & Flours ──
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Wheat flour', 'Grain', 'קמח חיטה', 'דגן', 'Safe. Allergen: gluten/wheat.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Wheat flour' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Rice flour', 'Grain', 'קמח אורז', 'דגן', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Rice flour' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Corn starch', 'Grain', 'עמילן תירס', 'דגן', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Corn starch' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Flour', 'Grain', 'קמח', 'דגן', 'Safe. May contain allergen: gluten.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Flour' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Starch', 'Grain', 'עמילן', 'דגן', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Starch' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Modified starch', 'Thickener', 'עמילן מותאם', 'מעבה', 'Generally recognized as safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Modified starch' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Wheat', 'Grain', 'חיטה', 'דגן', 'Safe. Allergen: gluten/wheat.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Wheat' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Barley malt extract', 'Grain', 'תמצית לתת שעורה', 'דגן', 'Safe. Allergen: gluten.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Barley malt extract' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Semolina', 'Grain', 'סולת', 'דגן', 'Safe. Allergen: gluten/wheat.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Semolina' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Gluten', 'Protein', 'גלוטן', 'חלבון', 'Safe for most people. Allergen: gluten.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Gluten' COLLATE NOCASE);

-- ── Eggs ──
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Eggs', 'Basic ingredient', 'ביצים', 'מרכיב בסיסי', 'Safe. Allergen: eggs.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Eggs' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Egg yolk', 'Basic ingredient', 'חלמון ביצה', 'מרכיב בסיסי', 'Safe. Allergen: eggs.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Egg yolk' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Egg white', 'Basic ingredient', 'חלבון ביצה', 'מרכיב בסיסי', 'Safe. Allergen: eggs.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Egg white' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Egg powder', 'Basic ingredient', 'אבקת ביצים', 'מרכיב בסיסי', 'Safe. Allergen: eggs.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Egg powder' COLLATE NOCASE);

-- ── Proteins ──
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Soy protein', 'Protein', 'חלבון סויה', 'חלבון', 'Safe. Allergen: soy.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Soy protein' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Whey protein', 'Protein', 'חלבון מי גבינה', 'חלבון', 'Safe. Allergen: milk.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Whey protein' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Milk protein', 'Protein', 'חלבון חלב', 'חלבון', 'Safe. Allergen: milk.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Milk protein' COLLATE NOCASE);

-- ── Nuts & Seeds ──
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Peanuts', 'Nut', 'בוטנים', 'אגוז', 'Safe. Allergen: peanuts.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Peanuts' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Almonds', 'Nut', 'שקדים', 'אגוז', 'Safe. Allergen: tree nuts.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Almonds' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Hazelnuts', 'Nut', 'אגוזי לוז', 'אגוז', 'Safe. Allergen: tree nuts.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Hazelnuts' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Sesame', 'Seed', 'שומשום', 'זרע', 'Safe. Allergen: sesame.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Sesame' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Sesame seeds', 'Seed', 'זרעי שומשום', 'זרע', 'Safe. Allergen: sesame.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Sesame seeds' COLLATE NOCASE);

-- ── Vitamins & Minerals ──
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Folic acid', 'Vitamin', 'חומצה פולית', 'ויטמין', 'Safe. Essential nutrient.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Folic acid' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Vitamin B6', 'Vitamin', 'ויטמין B6', 'ויטמין', 'Safe. Essential nutrient.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Vitamin B6' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Vitamin B1 (Thiamine)', 'Vitamin', 'ויטמין B1 (תיאמין)', 'ויטמין', 'Safe. Essential nutrient.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Vitamin B1 (Thiamine)' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Vitamin B2 (Riboflavin)', 'Vitamin', 'ויטמין B2 (ריבופלבין)', 'ויטמין', 'Safe. Essential nutrient.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Vitamin B2 (Riboflavin)' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Vitamin B12', 'Vitamin', 'ויטמין B12', 'ויטמין', 'Safe. Essential nutrient.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Vitamin B12' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Vitamin D', 'Vitamin', 'ויטמין D', 'ויטמין', 'Safe. Essential nutrient.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Vitamin D' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Vitamin E', 'Vitamin', 'ויטמין E', 'ויטמין', 'Safe. Essential nutrient.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Vitamin E' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Vitamin A', 'Vitamin', 'ויטמין A', 'ויטמין', 'Safe. Essential nutrient.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Vitamin A' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Vitamin C', 'Vitamin', 'ויטמין C', 'ויטמין', 'Safe. Essential nutrient.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Vitamin C' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Iron', 'Mineral', 'ברזל', 'מינרל', 'Safe. Essential nutrient.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Iron' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Calcium', 'Mineral', 'סידן', 'מינרל', 'Safe. Essential nutrient.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Calcium' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Zinc', 'Mineral', 'אבץ', 'מינרל', 'Safe. Essential nutrient.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Zinc' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Niacin', 'Vitamin', 'ניאצין', 'ויטמין', 'Safe. Essential nutrient.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Niacin' COLLATE NOCASE);

-- ── Vegetables & Fruits ──
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Tomato paste', 'Basic ingredient', 'רסק עגבניות', 'מרכיב בסיסי', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Tomato paste' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Tomato concentrate', 'Basic ingredient', 'תמצית עגבניות', 'מרכיב בסיסי', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Tomato concentrate' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Onion', 'Basic ingredient', 'בצל', 'מרכיב בסיסי', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Onion' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Garlic', 'Basic ingredient', 'שום', 'מרכיב בסיסי', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Garlic' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Lemon juice', 'Basic ingredient', 'מיץ לימון', 'מרכיב בסיסי', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Lemon juice' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Potato starch', 'Basic ingredient', 'עמילן תפוחי אדמה', 'מרכיב בסיסי', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Potato starch' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Onion powder', 'Spice', 'אבקת בצל', 'תבלין', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Onion powder' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Garlic powder', 'Spice', 'אבקת שום', 'תבלין', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Garlic powder' COLLATE NOCASE);

-- ── Spices & Herbs ──
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Mustard', 'Spice', 'חרדל', 'תבלין', 'Safe. Allergen: mustard.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Mustard' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Mustard seeds', 'Spice', 'זרעי חרדל', 'תבלין', 'Safe. Allergen: mustard.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Mustard seeds' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Pepper', 'Spice', 'פלפל', 'תבלין', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Pepper' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Paprika', 'Spice', 'פפריקה', 'תבלין', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Paprika' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Cinnamon', 'Spice', 'קינמון', 'תבלין', 'Safe in food amounts.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Cinnamon' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Turmeric', 'Spice', 'כורכום', 'תבלין', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Turmeric' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Cumin', 'Spice', 'כמון', 'תבלין', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Cumin' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Parsley', 'Spice', 'פטרוזיליה', 'תבלין', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Parsley' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Dill', 'Spice', 'שמיר', 'תבלין', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Dill' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Vanilla', 'Flavoring', 'וניל', 'חומר טעם', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Vanilla' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Vanilla extract', 'Flavoring', 'תמצית וניל', 'חומר טעם', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Vanilla extract' COLLATE NOCASE);

-- ── Other common ──
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Vinegar', 'Acid/Condiment', 'חומץ', 'חומצה/תבלין', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Vinegar' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Gelatin', 'Gelling agent', 'ג''לטין', 'חומר מג''לטן', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Gelatin' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Soy', 'Basic ingredient', 'סויה', 'מרכיב בסיסי', 'Safe. Allergen: soy.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Soy' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Rice', 'Grain', 'אורז', 'דגן', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Rice' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Potassium chloride', 'Mineral salt', 'אשלגן כלורי', 'מלח מינרלי', 'Safe in normal food amounts.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Potassium chloride' COLLATE NOCASE);

-- ════════════════════════════════════════════════════════════════
-- PART 2: Hebrew aliases → food_aliases
-- These map common Hebrew ingredient forms to English canonical
-- names, enabling the Step 0 alias resolution to work for Hebrew
-- ════════════════════════════════════════════════════════════════

-- Direct Hebrew → English aliases for basic ingredients
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('מלח', 'Salt');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('סוכר', 'Sugar');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('מים', 'Water');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('סוכר לבן', 'White sugar');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('מלח שולחן', 'Table salt');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חומרי טעם וריח', 'Flavoring agents');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חומרי טעם וריח טבעיים', 'Natural flavoring agents');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('תבלינים', 'Spices');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שמרים', 'Yeast');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('תמצית שמרים', 'Yeast extract');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('קפאין', 'Caffeine');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('פחמן דו-חמצני', 'Carbon dioxide');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('פחמן דו חמצני', 'Carbon dioxide');

-- Chocolate / Cocoa
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חמאת קקאו', 'Cocoa butter');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('עיסת קקאו', 'Cocoa paste');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('מסת קקאו', 'Cocoa mass');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אבקת קקאו', 'Cocoa powder');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('קקאו', 'Cocoa powder');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שוקולד', 'Chocolate');

-- Oils & Fats
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שמן צמחי', 'Vegetable oil');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שמן חמניות', 'Sunflower oil');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שמן דקל', 'Palm oil');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שמן קנולה', 'Canola oil');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שמן זית', 'Olive oil');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שמן קוקוס', 'Coconut oil');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שמן סויה', 'Soybean oil');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שמן תירס', 'Corn oil');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שמנים ושומנים מהצומח', 'Vegetable oils and fats');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שומן חלב', 'Milk fat');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חמאה', 'Butter');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('מרגרינה', 'Margarine');

-- Dairy
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אבקת חלב', 'Milk powder');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אבקת חלב כחוש', 'Skim milk powder');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אבקת חלב מלא', 'Whole milk powder');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אבקת חלב דלת שומן', 'Low-fat milk powder');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אבקת חלב רזה', 'Non-fat milk powder');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אבקת מי גבינה', 'Whey powder');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חלב', 'Milk');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שמנת', 'Cream');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('לקטוז', 'Lactose');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('מי גבינה', 'Whey');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('קזאין', 'Casein');

-- Sugars & Sweeteners
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('פרוקטוז', 'Fructose');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('סוכר פירות', 'Fruit sugar');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('סירופ גלוקוז', 'Glucose syrup');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('סירופ גלוקוזה', 'Glucose syrup');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('דקסטרוז', 'Dextrose');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('מלטודקסטרין', 'Maltodextrin');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('גלוקוז', 'Glucose');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('סוכרוז', 'Sucrose');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('דבש', 'Honey');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('סירופ תירס', 'Corn syrup');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('סירופ גלוקוז-פרוקטוז', 'Glucose-fructose syrup');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('סוכר אינוורט', 'Invert sugar');

-- Grains & Flours
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('קמח חיטה', 'Wheat flour');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('קמח אורז', 'Rice flour');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('עמילן תירס', 'Corn starch');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('קמח', 'Flour');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('עמילן', 'Starch');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('עמילן מותאם', 'Modified starch');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חיטה', 'Wheat');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('תמצית לתת שעורה', 'Barley malt extract');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('סולת', 'Semolina');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('גלוטן', 'Gluten');

-- Eggs
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('ביצים', 'Eggs');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('ביצה', 'Eggs');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חלמון ביצה', 'Egg yolk');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חלבון ביצה', 'Egg white');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אבקת ביצים', 'Egg powder');

-- Proteins
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חלבון סויה', 'Soy protein');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חלבון מי גבינה', 'Whey protein');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חלבון חלב', 'Milk protein');

-- Nuts & Seeds
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('בוטנים', 'Peanuts');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שקדים', 'Almonds');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אגוזי לוז', 'Hazelnuts');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שומשום', 'Sesame');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('זרעי שומשום', 'Sesame seeds');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אגוזי מלך', 'Walnuts');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('קשיו', 'Cashews');

-- Vitamins
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חומצה פולית', 'Folic acid');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('ויטמין b6', 'Vitamin B6');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('ויטמין b1 (תיאמין)', 'Vitamin B1 (Thiamine)');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('ויטמין b2 (ריבופלבין)', 'Vitamin B2 (Riboflavin)');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('ויטמין b12', 'Vitamin B12');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('ברזל', 'Iron');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('סידן', 'Calcium');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אבץ', 'Zinc');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('ניאצין', 'Niacin');

-- Vegetables & Produce
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('רסק עגבניות', 'Tomato paste');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('תמצית עגבניות', 'Tomato concentrate');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('בצל', 'Onion');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שום', 'Garlic');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('מיץ לימון', 'Lemon juice');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('עמילן תפוחי אדמה', 'Potato starch');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אבקת בצל', 'Onion powder');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אבקת שום', 'Garlic powder');

-- Spices & Herbs
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חרדל', 'Mustard');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('זרעי חרדל', 'Mustard seeds');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('פלפל', 'Pepper');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('פפריקה', 'Paprika');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('קינמון', 'Cinnamon');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('כורכום', 'Turmeric');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('כמון', 'Cumin');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('פטרוזיליה', 'Parsley');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שמיר', 'Dill');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('וניל', 'Vanilla');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('תמצית וניל', 'Vanilla extract');

-- Other common
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חומץ', 'Vinegar');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('ג''לטין', 'Gelatin');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('סויה', 'Soy');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אורז', 'Rice');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אשלגן כלורי', 'Potassium chloride');

-- Emulsifiers (Hebrew function descriptions → canonical)
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('מתחלב (לציטין סויה)', 'Lecithins');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('לציטין סויה', 'Lecithins');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('לציטין', 'Lecithins');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('לציטין לפתית', 'Lecithins');

-- Common Hebrew forms with parenthetical E-numbers or context
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('סוכר פירות (פרוקטוז)', 'Fructose');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('קמח חיטה (מכיל גלוטן)', 'Wheat flour');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('תמצית לתת שעורה (מכיל גלוטן)', 'Barley malt extract');

-- ════════════════════════════════════════════════════════════════
-- PART 3: Additional high-frequency Hebrew ingredients (Round 2)
-- From remaining unmatched after first pass
-- ════════════════════════════════════════════════════════════════

-- Additional food_additives entries
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Corn grits', 'Grain', 'גריסי תירס', 'דגן', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Corn grits' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Corn flour', 'Grain', 'קמח תירס', 'דגן', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Corn flour' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Seasoning mix', 'Flavoring', 'תערובת תיבול', 'חומר טעם', 'Generally recognized as safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Seasoning mix' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Palm fat', 'Fat/Oil', 'שומן דקלים', 'שומן/שמן', 'Generally recognized as safe. Environmental concerns.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Palm fat' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Hardened palm fat', 'Fat/Oil', 'שומן דקלים מוקשה', 'שומן/שמן', 'Concern: trans fats from hydrogenation process.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Hardened palm fat' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Vegetable oils', 'Fat/Oil', 'שמנים צמחיים', 'שומן/שמן', 'Generally recognized as safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Vegetable oils' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Plant vegetable oils and fats', 'Fat/Oil', 'שמנים ושומנים צמחיים', 'שומן/שמן', 'Generally recognized as safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Plant vegetable oils and fats' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Plant oils', 'Fat/Oil', 'שמנים מהצומח', 'שומן/שמן', 'Generally recognized as safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Plant oils' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Milk components powder', 'Dairy', 'אבקת רכיבי חלב', 'מוצר חלב', 'Safe. Allergen: milk.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Milk components powder' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Purple carrot concentrate', 'Color', 'רכז גזר סגול', 'צבע מאכל', 'Safe. Natural food coloring.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Purple carrot concentrate' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Safflower concentrate', 'Color', 'רכז קורטם', 'צבע מאכל', 'Safe. Natural food coloring.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Safflower concentrate' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Flavoring', 'Flavoring', 'חומרי טעם', 'חומר טעם', 'Generally recognized as safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Flavoring' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Soy sauce', 'Condiment', 'רוטב סויה', 'תבלין', 'Safe. Allergen: soy.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Soy sauce' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Tomato powder', 'Basic ingredient', 'אבקת עגבניות', 'מרכיב בסיסי', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Tomato powder' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Oat flour', 'Grain', 'קמח שיבולת שועל', 'דגן', 'Safe. Allergen: may contain gluten.' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Oat flour' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Cocoa', 'Basic ingredient', 'קקאו', 'מרכיב בסיסי', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Cocoa' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Chocolate', 'Basic ingredient', 'שוקולד', 'מרכיב בסיסי', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Chocolate' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Dried onion', 'Spice', 'בצל מיובש', 'תבלין', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Dried onion' COLLATE NOCASE);
INSERT INTO food_additives (common_name, category, hebrew_name, category_he, health_concerns) SELECT 'Dried garlic', 'Spice', 'שום מיובש', 'תבלין', 'Safe' WHERE NOT EXISTS (SELECT 1 FROM food_additives WHERE common_name = 'Dried garlic' COLLATE NOCASE);

-- Additional Hebrew aliases (Round 2)
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('גריסי תירס', 'Corn grits');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('קמח תירס', 'Corn flour');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('תערובת תיבול', 'Seasoning mix');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שומן דקלים', 'Palm fat');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שומן דקלים מוקשה', 'Hardened palm fat');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שמנים צמחיים', 'Vegetable oils');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שמנים ושומנים צמחיים', 'Plant vegetable oils and fats');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שמנים מהצומח', 'Plant oils');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אבקת רכיבי חלב', 'Milk components powder');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('רכז גזר סגול', 'Purple carrot concentrate');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('רכז קורטם', 'Safflower concentrate');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('חומרי טעם', 'Flavoring');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('רוטב סויה', 'Soy sauce');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('אבקת עגבניות', 'Tomato powder');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('קמח שיבולת שועל', 'Oat flour');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('קקאו', 'Cocoa');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שוקולד', 'Chocolate');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('בצל מיובש', 'Dried onion');
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('שום מיובש', 'Dried garlic');
