-- ==========================================
-- FOOD SERVINGS MIGRATION
-- Adds food-specific serving sizes with gram equivalents
-- ==========================================

-- ==========================================
-- 1. DROP EXISTING VIEWS (will be recreated)
-- ==========================================
DROP VIEW IF EXISTS meal_time_summary CASCADE;
DROP VIEW IF EXISTS daily_summary CASCADE;

-- ==========================================
-- 2. CREATE FOOD_SERVINGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS food_servings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  food_id UUID REFERENCES foods(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,                 -- e.g., 'small', 'medium', 'large', 'cup', 'slice'
  grams NUMERIC NOT NULL,             -- grams for this serving size (food-specific)
  is_default BOOLEAN DEFAULT false,   -- default serving for this food
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(food_id, name)               -- each serving name is unique per food
);

-- Enable RLS
ALTER TABLE food_servings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Food servings viewable by all" ON food_servings FOR SELECT USING (true);
CREATE POLICY "Users can create food servings" ON food_servings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update food servings" ON food_servings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete food servings" ON food_servings FOR DELETE TO authenticated USING (true);

-- ==========================================
-- 3. ADD GRAM-BASED NUTRITION TO FOODS
-- ==========================================
ALTER TABLE foods ADD COLUMN IF NOT EXISTS serving_grams NUMERIC;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS calories_per_100g NUMERIC;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS protein_per_100g NUMERIC;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS carbs_per_100g NUMERIC;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS fat_per_100g NUMERIC;

-- ==========================================
-- 4. ADD SERVING FIELDS TO LOGS
-- ==========================================
ALTER TABLE logs ADD COLUMN IF NOT EXISTS food_serving_id UUID REFERENCES food_servings(id) ON DELETE SET NULL;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS custom_serving_grams NUMERIC;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS time_logged TIME;  -- Specific time of day

-- ==========================================
-- 5. RECREATE VIEWS WITH GRAM-BASED CALCULATIONS
-- ==========================================

-- Daily summary view
CREATE VIEW daily_summary AS
SELECT 
  l.user_id,
  l.date,
  ROUND(SUM(
    CASE 
      WHEN l.custom_serving_grams IS NOT NULL AND f.calories_per_100g IS NOT NULL THEN
        f.calories_per_100g * (l.custom_serving_grams / 100) * l.servings_consumed
      ELSE
        f.calories * l.servings_consumed
    END
  ), 1) AS total_calories,
  ROUND(SUM(
    CASE 
      WHEN l.custom_serving_grams IS NOT NULL AND f.protein_per_100g IS NOT NULL THEN
        f.protein_per_100g * (l.custom_serving_grams / 100) * l.servings_consumed
      ELSE
        f.protein * l.servings_consumed
    END
  ), 1) AS total_protein,
  ROUND(SUM(
    CASE 
      WHEN l.custom_serving_grams IS NOT NULL AND f.carbs_per_100g IS NOT NULL THEN
        f.carbs_per_100g * (l.custom_serving_grams / 100) * l.servings_consumed
      ELSE
        f.carbs * l.servings_consumed
    END
  ), 1) AS total_carbs,
  ROUND(SUM(
    CASE 
      WHEN l.custom_serving_grams IS NOT NULL AND f.fat_per_100g IS NOT NULL THEN
        f.fat_per_100g * (l.custom_serving_grams / 100) * l.servings_consumed
      ELSE
        f.fat * l.servings_consumed
    END
  ), 1) AS total_fat
FROM logs l
JOIN foods f ON l.food_id = f.id
GROUP BY l.user_id, l.date;

-- Meal time summary view
CREATE VIEW meal_time_summary AS
SELECT 
  l.user_id,
  l.date,
  l.meal_time,
  ROUND(SUM(
    CASE 
      WHEN l.custom_serving_grams IS NOT NULL AND f.calories_per_100g IS NOT NULL THEN
        f.calories_per_100g * (l.custom_serving_grams / 100) * l.servings_consumed
      ELSE
        f.calories * l.servings_consumed
    END
  ), 1) AS calories,
  ROUND(SUM(
    CASE 
      WHEN l.custom_serving_grams IS NOT NULL AND f.protein_per_100g IS NOT NULL THEN
        f.protein_per_100g * (l.custom_serving_grams / 100) * l.servings_consumed
      ELSE
        f.protein * l.servings_consumed
    END
  ), 1) AS protein,
  ROUND(SUM(
    CASE 
      WHEN l.custom_serving_grams IS NOT NULL AND f.carbs_per_100g IS NOT NULL THEN
        f.carbs_per_100g * (l.custom_serving_grams / 100) * l.servings_consumed
      ELSE
        f.carbs * l.servings_consumed
    END
  ), 1) AS carbs,
  ROUND(SUM(
    CASE 
      WHEN l.custom_serving_grams IS NOT NULL AND f.fat_per_100g IS NOT NULL THEN
        f.fat_per_100g * (l.custom_serving_grams / 100) * l.servings_consumed
      ELSE
        f.fat * l.servings_consumed
    END
  ), 1) AS fat
FROM logs l
JOIN foods f ON l.food_id = f.id
GROUP BY l.user_id, l.date, l.meal_time;

-- ==========================================
-- 6. FUNCTION TO CALCULATE GRAMS FROM SERVING
-- ==========================================
CREATE OR REPLACE FUNCTION get_log_grams(
  p_log_id UUID
) RETURNS NUMERIC AS $$
DECLARE
  v_grams NUMERIC;
BEGIN
  SELECT 
    COALESCE(
      l.custom_serving_grams,
      fs.grams,
      f.serving_grams,
      f.serving_size  -- fallback to legacy serving_size
    )
  INTO v_grams
  FROM logs l
  JOIN foods f ON l.food_id = f.id
  LEFT JOIN food_servings fs ON l.food_serving_id = fs.id
  WHERE l.id = p_log_id;
  
  RETURN v_grams;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 7. FUNCTION TO GET LOG WITH CALCULATED NUTRITION
-- ==========================================
CREATE OR REPLACE FUNCTION get_log_with_nutrition(
  p_log_id UUID
) RETURNS TABLE (
  log_id UUID,
  food_id UUID,
  food_name TEXT,
  food_brand TEXT,
  servings_consumed NUMERIC,
  meal_time TEXT,
  date DATE,
  time_logged TIME,
  serving_name TEXT,
  serving_grams NUMERIC,
  calories NUMERIC,
  protein NUMERIC,
  carbs NUMERIC,
  fat NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id AS log_id,
    f.id AS food_id,
    f.name AS food_name,
    f.brand AS food_brand,
    l.servings_consumed,
    l.meal_time,
    l.date,
    l.time_logged,
    fs.name AS serving_name,
    COALESCE(l.custom_serving_grams, fs.grams, f.serving_grams, f.serving_size) AS serving_grams,
    ROUND(
      CASE 
        WHEN l.custom_serving_grams IS NOT NULL AND f.calories_per_100g IS NOT NULL THEN
          f.calories_per_100g * (l.custom_serving_grams / 100) * l.servings_consumed
        ELSE
          f.calories * l.servings_consumed
      END
    , 1) AS calories,
    ROUND(
      CASE 
        WHEN l.custom_serving_grams IS NOT NULL AND f.protein_per_100g IS NOT NULL THEN
          f.protein_per_100g * (l.custom_serving_grams / 100) * l.servings_consumed
        ELSE
          f.protein * l.servings_consumed
      END
    , 1) AS protein,
    ROUND(
      CASE 
        WHEN l.custom_serving_grams IS NOT NULL AND f.carbs_per_100g IS NOT NULL THEN
          f.carbs_per_100g * (l.custom_serving_grams / 100) * l.servings_consumed
        ELSE
          f.carbs * l.servings_consumed
      END
    , 1) AS carbs,
    ROUND(
      CASE 
        WHEN l.custom_serving_grams IS NOT NULL AND f.fat_per_100g IS NOT NULL THEN
          f.fat_per_100g * (l.custom_serving_grams / 100) * l.servings_consumed
        ELSE
          f.fat * l.servings_consumed
      END
    , 1) AS fat
  FROM logs l
  JOIN foods f ON l.food_id = f.id
  LEFT JOIN food_servings fs ON l.food_serving_id = fs.id
  WHERE l.id = p_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 8. INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_food_servings_food_id ON food_servings(food_id);
CREATE INDEX IF NOT EXISTS idx_logs_food_serving_id ON logs(food_serving_id);
CREATE INDEX IF NOT EXISTS idx_logs_time_logged ON logs(time_logged);
