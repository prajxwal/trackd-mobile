// User settings
export interface UserSettings {
  user_id: string;
  units: 'metric' | 'imperial';
  theme: 'dark' | 'light';
  rest_days: number[]; // 0-6, Sunday = 0
  calorie_goal: number;
  protein_goal: number;
}

// Exercise
export interface Exercise {
  id: string;
  user_id?: string;
  name: string;
  category: 'strength' | 'cardio' | 'flexibility';
  muscle_groups: string[];
  is_custom: boolean;
  created_at?: string;
}

// Workout Set
export interface WorkoutSet {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise?: Exercise;
  set_number: number;
  reps?: number;
  weight?: number;
  duration?: number; // seconds for cardio
  distance?: number;
  calories?: number;
  created_at?: string;
}

// Workout
export interface Workout {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  notes?: string;
  sets?: WorkoutSet[];
  created_at?: string;
}

// Body Measurement
export interface BodyMeasurement {
  id: string;
  user_id: string;
  date: string;
  weight?: number;
  body_fat?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    left_arm?: number;
    right_arm?: number;
    left_thigh?: number;
    right_thigh?: number;
    [key: string]: number | undefined;
  };
  created_at?: string;
}

// Food Entry
export interface FoodEntry {
  id: string;
  user_id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  serving_size?: string;
  created_at?: string;
}

// Personal Record
export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  exercise?: Exercise;
  record_type: 'max_weight' | 'max_reps' | 'max_volume';
  value: number;
  achieved_at: string;
  created_at?: string;
}

// Daily Nutrition Summary
export interface DailyNutrition {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  entries: FoodEntry[];
}

// Streak Info
export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate?: string;
}

// Stats
export interface UserStats {
  totalWorkouts: number;
  totalWeightLifted: number;
  avgWorkoutsPerWeek: number;
  currentStreak: number;
  longestStreak: number;
}
