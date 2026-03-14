-- ============================================================
-- Phase 1: Fix specific items from Benda's screenshot testing
-- ============================================================

-- Guar Gum: wrong category (preservative → thickener)
UPDATE food_additives SET category = 'thickener', category_he = 'מעבה', hebrew_name = 'גואר גאם' WHERE LOWER(common_name) = 'guar gum';

-- Egg Yolk: missing Hebrew name and category_he
UPDATE food_additives SET hebrew_name = 'חלמון ביצה', category_he = 'מזון שלם' WHERE LOWER(common_name) = 'egg yolk';

-- Beta Carotene: missing Hebrew name and category_he
UPDATE food_additives SET hebrew_name = 'בטא קרוטן', category_he = 'צבע מאכל טבעי' WHERE LOWER(common_name) = 'beta carotene';

-- Add "Flavor" as alias for "Flavoring"
INSERT OR IGNORE INTO food_aliases (alias_name, canonical_name) VALUES ('flavor', 'flavoring');

-- ============================================================
-- Phase 2: Normalize categories — merge duplicates, fix casing
-- ============================================================

-- Merge casing duplicates
UPDATE food_additives SET category = 'sweetener' WHERE category = 'Sweetener';
UPDATE food_additives SET category = 'dairy' WHERE category = 'Dairy';
UPDATE food_additives SET category = 'nut' WHERE category = 'Nut';
UPDATE food_additives SET category = 'protein' WHERE category = 'Protein';
UPDATE food_additives SET category = 'flavoring' WHERE category = 'Flavoring';
UPDATE food_additives SET category = 'flavoring' WHERE category = 'flavor';

-- Merge plural/singular duplicates
UPDATE food_additives SET category = 'emulsifier' WHERE category = 'emulsifiers';
UPDATE food_additives SET category = 'flavor_enhancer' WHERE category = 'flavor_enhancers';
UPDATE food_additives SET category = 'flavor_enhancer' WHERE category = 'flavor enhancer';

-- Merge similar categories
UPDATE food_additives SET category = 'base_ingredient' WHERE category = 'basic_ingredient';
UPDATE food_additives SET category = 'base_ingredient' WHERE category = 'Basic ingredient';
UPDATE food_additives SET category = 'base_ingredient' WHERE category = 'ingredient';
UPDATE food_additives SET category = 'oils_fats' WHERE category = 'Fat/Oil';
UPDATE food_additives SET category = 'oils_fats' WHERE category = 'oil';
UPDATE food_additives SET category = 'oils_fats' WHERE category = 'fat';
UPDATE food_additives SET category = 'colorant' WHERE category = 'Color';
UPDATE food_additives SET category = 'colorant' WHERE category = 'efsa_colours';
UPDATE food_additives SET category = 'sweetener' WHERE category = 'efsa_sweeteners';
UPDATE food_additives SET category = 'sweetener' WHERE category = 'sweetener_processed';

-- ============================================================
-- Phase 2b: Bulk set category_he for ALL normalized categories
-- ============================================================

UPDATE food_additives SET category_he = 'מרכיב בסיסי' WHERE category = 'base_ingredient' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'חומר משמר' WHERE category = 'preservative' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'חומר משמר טבעי' WHERE category = 'preservative_natural' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'מייצב' WHERE category = 'stabilizer' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'מווסת חומציות' WHERE category = 'acidity_regulator' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'מתחלב' WHERE category = 'emulsifier' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'מעבה' WHERE category = 'thickener' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'צבע מאכל' WHERE category = 'colorant' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'צבע מאכל טבעי' WHERE category = 'colorant_natural' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'צבע מאכל מלאכותי' WHERE category = 'colorant_artificial' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'נוגד חמצון' WHERE category = 'antioxidant' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'חומר טעם' WHERE category = 'flavoring' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'מגבר טעם' WHERE category = 'flavor_enhancer' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'ממתיק' WHERE category = 'sweetener' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'ממתיק טבעי' WHERE category = 'sweetener_natural' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'ממתיק מלאכותי' WHERE category = 'sweetener_artificial' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'שמנים ושומנים' WHERE category = 'oils_fats' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'חלבון' WHERE category = 'protein' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'חלבון צמחי' WHERE category = 'plant_proteins' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'עמילן' WHERE category = 'starch' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'סוכר' WHERE category = 'sugar' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'בשר' WHERE category = 'meat' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'מוצר חלב' WHERE category = 'dairy' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'מלח' WHERE category = 'salt' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'תבלין' WHERE category = 'spice' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'ויטמין' WHERE category = 'vitamin' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'מינרל' WHERE category = 'mineral' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'סיב תזונתי' WHERE category = 'fiber' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'גומי' WHERE category = 'gum' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'חומצת מזון' WHERE category = 'food_acid' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'לחותן' WHERE category = 'humectant' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'חומר תפיחה' WHERE category = 'raising_agent' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'נוגד גיבוש' WHERE category = 'anti_caking' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'חומר ציפוי' WHERE category = 'glazing_agent' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'חומר כולא' WHERE category = 'sequestrant' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'חומר מייצק' WHERE category = 'firming_agent' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'נושא' WHERE category = 'carrier' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'מזון שלם' WHERE category = 'whole_food' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'אגוז' WHERE category = 'nut' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'קמח' WHERE category = 'flour' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'ביצה' WHERE category = 'egg' AND (category_he IS NULL OR category_he = '');

-- Metadata categories (not real additive types) — give them descriptive Hebrew
UPDATE food_additives SET category_he = 'אלרגן' WHERE category = 'allergens' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'מזהם' WHERE category = 'contaminants' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'בבדיקה' WHERE category = 'under_scrutiny' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'חשש בטיחותי' WHERE category = 'safety_concerns' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'כשר / חלאל' WHERE category = 'halal_kosher' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'מזון תינוקות' WHERE category = 'baby_food' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'תזונת ספורט' WHERE category = 'sports_nutrition' AND (category_he IS NULL OR category_he = '');
UPDATE food_additives SET category_he = 'אחר' WHERE category = 'efsa_other' AND (category_he IS NULL OR category_he = '');

-- ============================================================
-- Phase 3: Hebrew names for common food ingredients
-- ============================================================

UPDATE food_additives SET hebrew_name = 'לציטין' WHERE LOWER(common_name) = 'lecithin' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'לציטין סויה' WHERE LOWER(common_name) = 'soy lecithin' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'לציטין חמניות' WHERE LOWER(common_name) = 'sunflower lecithin' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'חומצה סיטרית' WHERE LOWER(common_name) = 'citric acid' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'חומצה אסקורבית' WHERE LOWER(common_name) = 'ascorbic acid' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'נתרן ביקרבונט' WHERE LOWER(common_name) = 'sodium bicarbonate' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'נתרן כלורי' WHERE LOWER(common_name) = 'sodium chloride' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'קסנטן גאם' WHERE LOWER(common_name) = 'xanthan gum' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'קרגינן' WHERE LOWER(common_name) = 'carrageenan' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'גומי ערבי' WHERE LOWER(common_name) = 'gum arabic' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'גומי חרובין' WHERE LOWER(common_name) = 'locust bean gum' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'פקטין' WHERE LOWER(common_name) = 'pectin' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'ג׳לטין' WHERE LOWER(common_name) = 'gelatin' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'אגר' WHERE LOWER(common_name) = 'agar' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'מונוגליצרידים ודיגליצרידים' WHERE LOWER(common_name) = 'mono and diglycerides' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'סורביטול' WHERE LOWER(common_name) = 'sorbitol' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'מניטול' WHERE LOWER(common_name) = 'mannitol' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'מלטיטול' WHERE LOWER(common_name) = 'maltitol' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'אריתריטול' WHERE LOWER(common_name) = 'erythritol' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'סטביה' WHERE LOWER(common_name) = 'stevia' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'סוכרלוז' WHERE LOWER(common_name) = 'sucralose' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'נתרן בנזואט' WHERE LOWER(common_name) = 'sodium benzoate' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'אשלגן סורבט' WHERE LOWER(common_name) = 'potassium sorbate' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'נתרן ניטריט' WHERE LOWER(common_name) = 'sodium nitrite' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'נתרן ניטראט' WHERE LOWER(common_name) = 'sodium nitrate' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'חומצה בנזואית' WHERE LOWER(common_name) = 'benzoic acid' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'חומצה סורבית' WHERE LOWER(common_name) = 'sorbic acid' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'סידן פרופיונאט' WHERE LOWER(common_name) = 'calcium propionate' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'חומצה פוספורית' WHERE LOWER(common_name) = 'phosphoric acid' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'חומצה טרטרית' WHERE LOWER(common_name) = 'tartaric acid' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'חומצה פומרית' WHERE LOWER(common_name) = 'fumaric acid' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'סידן כלורי' WHERE LOWER(common_name) = 'calcium chloride' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'סידן קרבונט' WHERE LOWER(common_name) = 'calcium carbonate' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'ברזל' WHERE LOWER(common_name) = 'iron' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'אבץ' WHERE LOWER(common_name) = 'zinc' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'מלטודקסטרין' WHERE LOWER(common_name) = 'maltodextrin' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'תמצית שמרים' WHERE LOWER(common_name) = 'yeast extract' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'חומצה לקטית' WHERE LOWER(common_name) = 'lactic acid' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'גליצרין' WHERE LOWER(common_name) = 'glycerin' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'גליצרול' WHERE LOWER(common_name) = 'glycerol' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שמן דקלים' WHERE LOWER(common_name) = 'palm oil' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שמן סויה' WHERE LOWER(common_name) = 'soybean oil' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שמן חמניות' WHERE LOWER(common_name) = 'sunflower oil' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שמן קנולה' WHERE LOWER(common_name) = 'canola oil' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שמן זית' WHERE LOWER(common_name) = 'olive oil' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שמן קוקוס' WHERE LOWER(common_name) = 'coconut oil' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'תמצית תה ירוק' WHERE LOWER(common_name) = 'green tea extract' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'תמצית ענבים' WHERE LOWER(common_name) = 'grape seed extract' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'תמצית רוזמרין' WHERE LOWER(common_name) = 'rosemary extract' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'חלבון חיטה' WHERE LOWER(common_name) = 'wheat protein' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'חלבון סויה' WHERE LOWER(common_name) = 'soy protein' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'גלוטן' WHERE LOWER(common_name) = 'gluten' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'קפאין' WHERE LOWER(common_name) = 'caffeine' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'טאורין' WHERE LOWER(common_name) = 'taurine' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'אינוזיטול' WHERE LOWER(common_name) = 'inositol' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'עמילן תפוחי אדמה' WHERE LOWER(common_name) = 'potato starch' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'עמילן תירס' WHERE LOWER(common_name) = 'corn starch' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'עמילן מותאם' WHERE LOWER(common_name) = 'modified starch' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'סיבים תזונתיים' WHERE LOWER(common_name) = 'dietary fiber' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'תאית' WHERE LOWER(common_name) = 'cellulose' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'אינולין' WHERE LOWER(common_name) = 'inulin' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'סידן דינתרן EDTA' WHERE LOWER(common_name) = 'calcium disodium edta' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'ויטמין A' WHERE LOWER(common_name) = 'vitamin a' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'ויטמין C' WHERE LOWER(common_name) = 'vitamin c' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'ויטמין D' WHERE LOWER(common_name) = 'vitamin d' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'ויטמין E' WHERE LOWER(common_name) = 'vitamin e' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'חומצה פולית' WHERE LOWER(common_name) = 'folic acid' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'ניאצין' WHERE LOWER(common_name) = 'niacin' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'ריבופלבין' WHERE LOWER(common_name) = 'riboflavin' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'ביוטין' WHERE LOWER(common_name) = 'biotin' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'MSG' WHERE LOWER(common_name) = 'monosodium glutamate' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'גלוקוז' WHERE LOWER(common_name) = 'glucose' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'לקטוז' WHERE LOWER(common_name) = 'lactose' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'מלטוז' WHERE LOWER(common_name) = 'maltose' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'סוכרוז' WHERE LOWER(common_name) = 'sucrose' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'סירופ גלוקוז' WHERE LOWER(common_name) = 'glucose syrup' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'סירופ תירס' WHERE LOWER(common_name) = 'corn syrup' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'דבש' WHERE LOWER(common_name) = 'honey' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'חלב' WHERE LOWER(common_name) = 'milk' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'אבקת חלב' WHERE LOWER(common_name) = 'milk powder' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'מי חלב' WHERE LOWER(common_name) = 'whey' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'קזאין' WHERE LOWER(common_name) = 'casein' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'חמאה' WHERE LOWER(common_name) = 'butter' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שמנת' WHERE LOWER(common_name) = 'cream' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'קמח חיטה' WHERE LOWER(common_name) = 'wheat flour' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שיבולת שועל' WHERE LOWER(common_name) = 'oats' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'בוטנים' WHERE LOWER(common_name) = 'peanuts' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שקדים' WHERE LOWER(common_name) = 'almonds' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'אגוזי מלך' WHERE LOWER(common_name) = 'walnuts' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שומשום' WHERE LOWER(common_name) = 'sesame' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'סלרי' WHERE LOWER(common_name) = 'celery' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'תרמוס' WHERE LOWER(common_name) = 'lupin' AND (hebrew_name IS NULL OR hebrew_name = '');
