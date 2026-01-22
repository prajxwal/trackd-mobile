import { Exercise } from '../types';

export const defaultExercises: Omit<Exercise, 'id' | 'user_id'>[] = [
    // Chest
    { name: 'Bench Press', category: 'strength', muscle_groups: ['chest', 'triceps', 'shoulders'], is_custom: false },
    { name: 'Incline Bench Press', category: 'strength', muscle_groups: ['chest', 'shoulders'], is_custom: false },
    { name: 'Dumbbell Fly', category: 'strength', muscle_groups: ['chest'], is_custom: false },
    { name: 'Push-ups', category: 'strength', muscle_groups: ['chest', 'triceps'], is_custom: false },
    { name: 'Cable Crossover', category: 'strength', muscle_groups: ['chest'], is_custom: false },

    // Back
    { name: 'Deadlift', category: 'strength', muscle_groups: ['back', 'legs', 'core'], is_custom: false },
    { name: 'Bent Over Row', category: 'strength', muscle_groups: ['back', 'biceps'], is_custom: false },
    { name: 'Pull-ups', category: 'strength', muscle_groups: ['back', 'biceps'], is_custom: false },
    { name: 'Lat Pulldown', category: 'strength', muscle_groups: ['back', 'biceps'], is_custom: false },
    { name: 'Seated Row', category: 'strength', muscle_groups: ['back'], is_custom: false },

    // Shoulders
    { name: 'Overhead Press', category: 'strength', muscle_groups: ['shoulders', 'triceps'], is_custom: false },
    { name: 'Lateral Raise', category: 'strength', muscle_groups: ['shoulders'], is_custom: false },
    { name: 'Front Raise', category: 'strength', muscle_groups: ['shoulders'], is_custom: false },
    { name: 'Face Pull', category: 'strength', muscle_groups: ['shoulders', 'back'], is_custom: false },
    { name: 'Shrugs', category: 'strength', muscle_groups: ['shoulders', 'back'], is_custom: false },

    // Arms
    { name: 'Bicep Curl', category: 'strength', muscle_groups: ['biceps'], is_custom: false },
    { name: 'Hammer Curl', category: 'strength', muscle_groups: ['biceps'], is_custom: false },
    { name: 'Tricep Extension', category: 'strength', muscle_groups: ['triceps'], is_custom: false },
    { name: 'Tricep Pushdown', category: 'strength', muscle_groups: ['triceps'], is_custom: false },
    { name: 'Skull Crushers', category: 'strength', muscle_groups: ['triceps'], is_custom: false },

    // Legs
    { name: 'Squat', category: 'strength', muscle_groups: ['legs', 'core'], is_custom: false },
    { name: 'Leg Press', category: 'strength', muscle_groups: ['legs'], is_custom: false },
    { name: 'Lunges', category: 'strength', muscle_groups: ['legs'], is_custom: false },
    { name: 'Leg Curl', category: 'strength', muscle_groups: ['legs'], is_custom: false },
    { name: 'Leg Extension', category: 'strength', muscle_groups: ['legs'], is_custom: false },
    { name: 'Calf Raise', category: 'strength', muscle_groups: ['legs'], is_custom: false },
    { name: 'Romanian Deadlift', category: 'strength', muscle_groups: ['legs', 'back'], is_custom: false },

    // Core
    { name: 'Plank', category: 'strength', muscle_groups: ['core'], is_custom: false },
    { name: 'Crunches', category: 'strength', muscle_groups: ['core'], is_custom: false },
    { name: 'Leg Raise', category: 'strength', muscle_groups: ['core'], is_custom: false },
    { name: 'Russian Twist', category: 'strength', muscle_groups: ['core'], is_custom: false },
    { name: 'Ab Wheel Rollout', category: 'strength', muscle_groups: ['core'], is_custom: false },

    // Cardio
    { name: 'Running', category: 'cardio', muscle_groups: ['legs', 'cardio'], is_custom: false },
    { name: 'Cycling', category: 'cardio', muscle_groups: ['legs', 'cardio'], is_custom: false },
    { name: 'Rowing', category: 'cardio', muscle_groups: ['back', 'cardio'], is_custom: false },
    { name: 'Elliptical', category: 'cardio', muscle_groups: ['cardio'], is_custom: false },
    { name: 'Jump Rope', category: 'cardio', muscle_groups: ['cardio', 'legs'], is_custom: false },
    { name: 'Stair Climber', category: 'cardio', muscle_groups: ['legs', 'cardio'], is_custom: false },
    { name: 'Swimming', category: 'cardio', muscle_groups: ['cardio'], is_custom: false },

    // Flexibility
    { name: 'Stretching', category: 'flexibility', muscle_groups: ['flexibility'], is_custom: false },
    { name: 'Yoga', category: 'flexibility', muscle_groups: ['flexibility', 'core'], is_custom: false },
    { name: 'Foam Rolling', category: 'flexibility', muscle_groups: ['flexibility'], is_custom: false },
];

export const muscleGroups = [
    'chest',
    'back',
    'shoulders',
    'biceps',
    'triceps',
    'legs',
    'core',
    'cardio',
    'flexibility',
];

export const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
