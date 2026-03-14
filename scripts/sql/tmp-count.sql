SELECT COUNT(*) as with_hebrew FROM food_additives WHERE hebrew_name IS NOT NULL AND LENGTH(hebrew_name) > 0;
