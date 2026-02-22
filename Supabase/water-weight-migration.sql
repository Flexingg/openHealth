-- ==========================================
-- WATER AND WEIGHT LOGGING TABLES
-- ==========================================
-- Run this migration in Supabase SQL Editor
-- This adds support for tracking water intake and body weight

-- ==========================================
-- 1. WATER LOGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS water_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml NUMERIC NOT NULL,  -- Stored in milliliters (standardized)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own water logs" ON water_logs 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water logs" ON water_logs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own water logs" ON water_logs 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own water logs" ON water_logs 
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries by user and date
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON water_logs(user_id, date);

-- ==========================================
-- 2. WEIGHT LOGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC NOT NULL,  -- Stored in kilograms (standardized)
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own weight logs" ON weight_logs 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight logs" ON weight_logs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weight logs" ON weight_logs 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight logs" ON weight_logs 
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries by user and date
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON weight_logs(user_id, date);

-- ==========================================
-- 3. DAILY WATER SUMMARY VIEW
-- ==========================================
CREATE OR REPLACE VIEW daily_water_summary AS
SELECT 
  user_id,
  date,
  ROUND(SUM(amount_ml), 0) AS total_ml,
  ROUND(SUM(amount_ml) / 29.5735, 1) AS total_oz
FROM water_logs
GROUP BY user_id, date;

-- ==========================================
-- 4. COMMENTS FOR DOCUMENTATION
-- ==========================================
COMMENT ON TABLE water_logs IS 'Stores daily water intake logs for users';
COMMENT ON COLUMN water_logs.amount_ml IS 'Water amount in milliliters (standardized unit)';

COMMENT ON TABLE weight_logs IS 'Stores body weight logs for users';
COMMENT ON COLUMN weight_logs.weight_kg IS 'Weight in kilograms (standardized unit)';
COMMENT ON COLUMN weight_logs.notes IS 'Optional notes for the weight entry';
