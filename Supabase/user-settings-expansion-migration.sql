-- ==========================================
-- USER SETTINGS EXPANSION MIGRATION
-- ==========================================
-- Run this migration in Supabase SQL Editor
-- This expands user_settings to include:
-- - AI Configuration (moved from IndexedDB)
-- - Unit Preferences
-- - Quick Water Sizes
-- - User Profile (birthday, sex, height)
-- - Fitness Experience Levels

-- ==========================================
-- 1. ADD NEW COLUMNS TO user_settings
-- ==========================================

-- AI Configuration (moved from IndexedDB)
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS ai_provider TEXT 
  CHECK (ai_provider IN ('openai', 'anthropic', 'gemini'));
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS ai_api_key TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS ai_model_name TEXT;

-- Unit Preferences
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS weight_unit TEXT 
  CHECK (weight_unit IN ('lbs', 'kg')) DEFAULT 'lbs';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS height_unit TEXT 
  CHECK (height_unit IN ('ft', 'cm')) DEFAULT 'ft';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS water_unit TEXT 
  CHECK (water_unit IN ('oz', 'ml')) DEFAULT 'oz';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS distance_unit TEXT 
  CHECK (distance_unit IN ('mi', 'km')) DEFAULT 'mi';

-- Quick Add Water Sizes (stored in ml for standardization, converted for display)
-- Default values: 8oz (236.588ml), 16oz (473.176ml), 24oz (709.765ml)
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS quick_water_size_1 NUMERIC DEFAULT 236.588;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS quick_water_size_2 NUMERIC DEFAULT 473.176;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS quick_water_size_3 NUMERIC DEFAULT 709.765;

-- User Profile
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS sex TEXT 
  CHECK (sex IN ('male', 'female', 'other', 'prefer_not_to_say'));
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS height_cm NUMERIC;  -- Stored in cm, converted for display

-- Fitness Experience
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS cardio_experience TEXT 
  CHECK (cardio_experience IN ('none', 'beginner', 'intermediate', 'advanced')) DEFAULT 'none';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS lifting_experience TEXT 
  CHECK (lifting_experience IN ('none', 'beginner', 'intermediate', 'advanced')) DEFAULT 'none';

-- ==========================================
-- 2. UPDATE DEFAULT SETTINGS TRIGGER
-- ==========================================

-- Drop the trigger first, then the function, then recreate both
DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_settings();

CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_settings (
    user_id, 
    theme_mode, 
    accent_color,
    weight_unit,
    height_unit,
    water_unit,
    distance_unit,
    quick_water_size_1,
    quick_water_size_2,
    quick_water_size_3,
    cardio_experience,
    lifting_experience
  )
  VALUES (
    new.id, 
    'system', 
    '#10b981',
    'lbs',
    'ft',
    'oz',
    'mi',
    236.588,  -- 8oz in ml
    473.176,  -- 16oz in ml
    709.765,  -- 24oz in ml
    'none',
    'none'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_settings();

-- ==========================================
-- 3. ADD COMMENTS FOR DOCUMENTATION
-- ==========================================

COMMENT ON COLUMN user_settings.ai_provider IS 'AI provider: openai, anthropic, or gemini';
COMMENT ON COLUMN user_settings.ai_api_key IS 'API key for the selected AI provider';
COMMENT ON COLUMN user_settings.ai_model_name IS 'Model name/ID for the selected AI provider';

COMMENT ON COLUMN user_settings.weight_unit IS 'Preferred weight unit: lbs or kg';
COMMENT ON COLUMN user_settings.height_unit IS 'Preferred height unit: ft (imperial) or cm (metric)';
COMMENT ON COLUMN user_settings.water_unit IS 'Preferred water unit: oz or ml';
COMMENT ON COLUMN user_settings.distance_unit IS 'Preferred distance unit: mi or km';

COMMENT ON COLUMN user_settings.quick_water_size_1 IS 'First quick-add water size in ml (default: 8oz/236.588ml)';
COMMENT ON COLUMN user_settings.quick_water_size_2 IS 'Second quick-add water size in ml (default: 16oz/473.176ml)';
COMMENT ON COLUMN user_settings.quick_water_size_3 IS 'Third quick-add water size in ml (default: 24oz/709.765ml)';

COMMENT ON COLUMN user_settings.birthday IS 'User birthday for age calculations';
COMMENT ON COLUMN user_settings.sex IS 'User sex: male, female, other, or prefer_not_to_say';
COMMENT ON COLUMN user_settings.height_cm IS 'User height in centimeters (standardized storage)';

COMMENT ON COLUMN user_settings.cardio_experience IS 'Cardio fitness level: none, beginner, intermediate, or advanced';
COMMENT ON COLUMN user_settings.lifting_experience IS 'Lifting experience level: none, beginner, intermediate, or advanced';

-- ==========================================
-- 4. CREATE INDEX FOR FASTER SETTINGS LOOKUP
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- ==========================================
-- 5. UPDATE EXISTING RECORDS WITH DEFAULTS
-- ==========================================

-- Set default values for existing users who don't have the new columns set
UPDATE user_settings 
SET 
  weight_unit = COALESCE(weight_unit, 'lbs'),
  height_unit = COALESCE(height_unit, 'ft'),
  water_unit = COALESCE(water_unit, 'oz'),
  distance_unit = COALESCE(distance_unit, 'mi'),
  quick_water_size_1 = COALESCE(quick_water_size_1, 236.588),
  quick_water_size_2 = COALESCE(quick_water_size_2, 473.176),
  quick_water_size_3 = COALESCE(quick_water_size_3, 709.765),
  cardio_experience = COALESCE(cardio_experience, 'none'),
  lifting_experience = COALESCE(lifting_experience, 'none')
WHERE id IS NOT NULL;
