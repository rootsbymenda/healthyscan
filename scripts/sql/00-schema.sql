-- Schema migrations for exported-assets (29)
-- Add new columns to food_additives if they don't exist
-- SQLite doesn't have IF NOT EXISTS for ALTER TABLE, so these may fail if already added
ALTER TABLE food_additives ADD COLUMN frequency TEXT DEFAULT '';
ALTER TABLE food_additives ADD COLUMN israeli_products TEXT DEFAULT '';
ALTER TABLE food_additives ADD COLUMN category_he TEXT DEFAULT '';
ALTER TABLE food_additives ADD COLUMN moh_approved TEXT DEFAULT '';
ALTER TABLE food_additives ADD COLUMN tech_function TEXT DEFAULT '';