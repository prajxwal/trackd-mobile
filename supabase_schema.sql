-- Trackd Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable Row Level Security for all tables
-- First, let's create the tables

-- Exercises table (default + custom exercises)
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('strength', 'cardio', 'flexibility')),
  muscle_groups TEXT[],
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout Sets table
CREATE TABLE IF NOT EXISTS workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises,
  set_number INTEGER,
  reps INTEGER,
  weight DECIMAL,
  duration INTEGER, -- seconds for cardio
  distance DECIMAL,
  calories INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Body Measurements table
CREATE TABLE IF NOT EXISTS body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  date DATE NOT NULL,
  weight DECIMAL,
  body_fat DECIMAL,
  measurements JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food Entries table
CREATE TABLE IF NOT EXISTS food_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  date DATE NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name TEXT NOT NULL,
  calories INTEGER,
  protein DECIMAL,
  carbs DECIMAL,
  fat DECIMAL,
  serving_size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  units TEXT DEFAULT 'metric',
  theme TEXT DEFAULT 'dark',
  rest_days INTEGER[] DEFAULT '{0,6}',
  calorie_goal INTEGER DEFAULT 2000,
  protein_goal INTEGER DEFAULT 150,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personal Records table (optional for PR tracking)
CREATE TABLE IF NOT EXISTS personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  exercise_id UUID REFERENCES exercises,
  record_type TEXT CHECK (record_type IN ('max_weight', 'max_reps', 'max_volume')),
  value DECIMAL,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for exercises
CREATE POLICY "Users can view default and their own exercises" ON exercises
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can insert their own exercises" ON exercises
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own exercises" ON exercises
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own exercises" ON exercises
  FOR DELETE USING (user_id = auth.uid());

-- Policies for workouts
CREATE POLICY "Users can view their own workouts" ON workouts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own workouts" ON workouts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own workouts" ON workouts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own workouts" ON workouts
  FOR DELETE USING (user_id = auth.uid());

-- Policies for workout_sets (via workout ownership)
CREATE POLICY "Users can view their workout sets" ON workout_sets
  FOR SELECT USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert workout sets" ON workout_sets
  FOR INSERT WITH CHECK (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update workout sets" ON workout_sets
  FOR UPDATE USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete workout sets" ON workout_sets
  FOR DELETE USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

-- Policies for body_measurements
CREATE POLICY "Users can view their own measurements" ON body_measurements
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own measurements" ON body_measurements
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own measurements" ON body_measurements
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own measurements" ON body_measurements
  FOR DELETE USING (user_id = auth.uid());

-- Policies for food_entries
CREATE POLICY "Users can view their own food entries" ON food_entries
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own food entries" ON food_entries
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own food entries" ON food_entries
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own food entries" ON food_entries
  FOR DELETE USING (user_id = auth.uid());

-- Policies for user_settings
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (user_id = auth.uid());

-- Policies for personal_records
CREATE POLICY "Users can view their own PRs" ON personal_records
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own PRs" ON personal_records
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own PRs" ON personal_records
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own PRs" ON personal_records
  FOR DELETE USING (user_id = auth.uid());
