-- ==========================================
-- USER SETTINGS TABLE FOR MATERIAL YOU THEME
-- ==========================================
-- Run this migration in Supabase SQL Editor

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
  
  -- Theme settings
  theme_mode TEXT CHECK (theme_mode IN ('system', 'light', 'dark')) DEFAULT 'system',
  accent_color TEXT DEFAULT '#10b981', -- Hex color code (Material You default: teal)
  
  -- Other preferences
  default_meal_time TEXT CHECK (default_meal_time IN ('Breakfast', 'Lunch', 'Dinner', 'Snack', 'Other')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own settings" ON user_settings 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON user_settings 
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create default settings for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, theme_mode, accent_color)
  VALUES (new.id, 'system', '#10b981');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create settings for new users
DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_settings();

-- Add time_logged column to logs table for precise time tracking
ALTER TABLE logs ADD COLUMN IF NOT EXISTS time_logged TIME;

-- Create index for faster queries by time
CREATE INDEX IF NOT EXISTS idx_logs_time_logged ON logs(user_id, date, time_logged);

-- Comments for documentation
COMMENT ON TABLE user_settings IS 'Stores user preferences including Material You theme settings';
COMMENT ON COLUMN user_settings.theme_mode IS 'Theme preference: system (follow device), light, or dark';
COMMENT ON COLUMN user_settings.accent_color IS 'Hex color code for Material You dynamic accent color';
COMMENT ON COLUMN logs.time_logged IS 'Specific time the food was logged (not just meal category)';
