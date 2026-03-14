-- Update existing food_additives entries with Hebrew names and category_he
-- These entries already exist but are missing hebrew_name

-- Basics
UPDATE food_additives SET hebrew_name = 'מלח', category_he = 'מרכיב בסיסי' WHERE common_name = 'Salt' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'סוכר', category_he = 'ממתיק' WHERE common_name = 'Sugar' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'מים', category_he = 'מרכיב בסיסי' WHERE common_name = 'Water' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'חמאה', category_he = 'שומן/שמן' WHERE common_name = 'Butter' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'חלב', category_he = 'מוצר חלב' WHERE common_name = 'Milk' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שמנת', category_he = 'מוצר חלב' WHERE common_name = 'Cream' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'קמח', category_he = 'דגן' WHERE common_name = 'Flour' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'קמח חיטה', category_he = 'דגן' WHERE common_name = 'Wheat flour' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'עמילן תירס', category_he = 'דגן' WHERE common_name = 'Corn starch' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'אורז', category_he = 'דגן' WHERE common_name = 'Rice' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'ביצים', category_he = 'מרכיב בסיסי' WHERE common_name = 'Eggs' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'דבש', category_he = 'ממתיק' WHERE common_name = 'Honey' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'חומץ', category_he = 'חומצה/תבלין' WHERE common_name = 'Vinegar' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שמרים', category_he = 'מרכיב בסיסי' WHERE common_name = 'Yeast' AND (hebrew_name IS NULL OR hebrew_name = '');

-- Oils
UPDATE food_additives SET hebrew_name = 'שמן דקל', category_he = 'שומן/שמן' WHERE common_name = 'Palm oil' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שמן חמניות', category_he = 'שומן/שמן' WHERE common_name = 'Sunflower oil' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שמן זית', category_he = 'שומן/שמן' WHERE common_name = 'Olive oil' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שמן קנולה', category_he = 'שומן/שמן' WHERE common_name = 'Canola oil' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שמן סויה', category_he = 'שומן/שמן' WHERE common_name = 'Soybean oil' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שמן קוקוס', category_he = 'שומן/שמן' WHERE common_name = 'Coconut oil' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שמן צמחי', category_he = 'שומן/שמן' WHERE common_name = 'Vegetable oil' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שמן תירס', category_he = 'שומן/שמן' WHERE common_name = 'Corn oil' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שומן חלב', category_he = 'שומן/שמן' WHERE common_name = 'Milk fat' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'מרגרינה', category_he = 'שומן/שמן' WHERE common_name = 'Margarine' AND (hebrew_name IS NULL OR hebrew_name = '');

-- Sugars & Sweeteners
UPDATE food_additives SET hebrew_name = 'פרוקטוז', category_he = 'ממתיק' WHERE common_name = 'Fructose' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'גלוקוז', category_he = 'ממתיק' WHERE common_name = 'Glucose' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'סירופ גלוקוז', category_he = 'ממתיק' WHERE common_name = 'Glucose syrup' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'דקסטרוז', category_he = 'ממתיק' WHERE common_name = 'Dextrose' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'סוכרוז', category_he = 'ממתיק' WHERE common_name = 'Sucrose' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'לקטוז', category_he = 'מוצר חלב' WHERE common_name = 'Lactose' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'מלטוז', category_he = 'ממתיק' WHERE common_name = 'Maltose' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'מלטודקסטרין', category_he = 'ממתיק' WHERE common_name = 'Maltodextrin' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'סירופ תירס', category_he = 'ממתיק' WHERE common_name = 'Corn syrup' AND (hebrew_name IS NULL OR hebrew_name = '');

-- Dairy
UPDATE food_additives SET hebrew_name = 'אבקת חלב', category_he = 'מוצר חלב' WHERE common_name = 'Milk powder' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'מי גבינה', category_he = 'מוצר חלב' WHERE common_name = 'Whey' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'חלבון מי גבינה', category_he = 'חלבון' WHERE common_name = 'Whey protein' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'קזאין', category_he = 'חלבון' WHERE common_name = 'Casein' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'גלוטן', category_he = 'חלבון' WHERE common_name = 'Gluten' AND (hebrew_name IS NULL OR hebrew_name = '');

-- Grains
UPDATE food_additives SET hebrew_name = 'חיטה', category_he = 'דגן' WHERE common_name = 'Wheat' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שעורה', category_he = 'דגן' WHERE common_name = 'Barley' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שיבולת שועל', category_he = 'דגן' WHERE common_name = 'Oats' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'תירס', category_he = 'דגן' WHERE common_name = 'Corn' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'עמילן', category_he = 'דגן' WHERE common_name = 'Starch' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'עמילן מותאם', category_he = 'מעבה' WHERE common_name = 'Modified starch' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'תפוח אדמה', category_he = 'מרכיב בסיסי' WHERE common_name = 'Potato' AND (hebrew_name IS NULL OR hebrew_name = '');

-- Nuts
UPDATE food_additives SET hebrew_name = 'בוטנים', category_he = 'אגוז' WHERE common_name = 'Peanuts' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שקדים', category_he = 'אגוז' WHERE common_name = 'Almonds' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'אגוזי מלך', category_he = 'אגוז' WHERE common_name = 'Walnuts' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'אגוזי לוז', category_he = 'אגוז' WHERE common_name = 'Hazelnuts' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שומשום', category_he = 'זרע' WHERE common_name = 'Sesame' AND (hebrew_name IS NULL OR hebrew_name = '');

-- Vegetables
UPDATE food_additives SET hebrew_name = 'עגבנייה', category_he = 'מרכיב בסיסי' WHERE common_name = 'Tomato' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'רסק עגבניות', category_he = 'מרכיב בסיסי' WHERE common_name = 'Tomato paste' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'בצל', category_he = 'מרכיב בסיסי' WHERE common_name = 'Onion' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שום', category_he = 'מרכיב בסיסי' WHERE common_name = 'Garlic' AND (hebrew_name IS NULL OR hebrew_name = '');

-- Spices
UPDATE food_additives SET hebrew_name = 'פלפל', category_he = 'תבלין' WHERE common_name = 'Pepper' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'פפריקה', category_he = 'תבלין' WHERE common_name = 'Paprika' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'קינמון', category_he = 'תבלין' WHERE common_name = 'Cinnamon' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'כורכום', category_he = 'תבלין' WHERE common_name = 'Turmeric' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'וניל', category_he = 'חומר טעם' WHERE common_name = 'Vanilla' AND (hebrew_name IS NULL OR hebrew_name = '');

-- Other
UPDATE food_additives SET hebrew_name = 'ג''לטין', category_he = 'חומר מג''לטן' WHERE common_name = 'Gelatin' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'פקטין', category_he = 'חומר מג''לטן' WHERE common_name = 'Pectin' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'סויה', category_he = 'מרכיב בסיסי' WHERE common_name = 'Soy' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'לציטין סויה', category_he = 'מתחלב' WHERE common_name = 'Soy lecithin' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'שוקולד', category_he = 'מרכיב בסיסי' WHERE common_name = 'Chocolate' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'קקאו', category_he = 'מרכיב בסיסי' WHERE common_name = 'Cocoa' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'אבקת קקאו', category_he = 'מרכיב בסיסי' WHERE common_name = 'Cocoa powder' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'קפאין', category_he = 'ממריץ' WHERE common_name = 'Caffeine' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'חומצה פולית', category_he = 'ויטמין' WHERE common_name = 'Folic acid' AND (hebrew_name IS NULL OR hebrew_name = '');
UPDATE food_additives SET hebrew_name = 'ברזל', category_he = 'מינרל' WHERE common_name = 'Iron' AND (hebrew_name IS NULL OR hebrew_name = '');
