/**
 * Body Calculations Utility
 * 
 * Contains all metabolic calculations for:
 * - BMR (Mifflin-St Jeor formula)
 * - TDEE (BMR × activity multiplier)
 * - Goal-adjusted calorie targets
 * - Macro calculations (protein, fat, carbs)
 */

import {
    Sex,
    ActivityLevel,
    GoalType,
    GoalIntensity,
    NutritionTargets,
    ACTIVITY_MULTIPLIERS,
} from '../types';

// Minimum calorie floors for safety
const MIN_CALORIES_MALE = 1500;
const MIN_CALORIES_FEMALE = 1200;

/**
 * Calculate BMR using Mifflin-St Jeor formula
 * Most clinically validated formula for general population
 */
export function calculateBMR(
    weightKg: number,
    heightCm: number,
    age: number,
    sex: Sex
): number {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return sex === 'male' ? base + 5 : base - 161;
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 * TDEE = BMR × activity multiplier
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
    return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

/**
 * Get deficit percentage based on goal type and intensity
 */
export function getDeficitPercent(
    goalType: GoalType,
    goalIntensity: GoalIntensity,
    customDeficitPercent?: number
): number {
    if (goalType === 'cut') {
        // Custom deficit takes priority
        if (customDeficitPercent !== undefined && customDeficitPercent > 0) {
            return Math.min(customDeficitPercent, 30) / 100; // Cap at 30%
        }
        // Preset intensities
        switch (goalIntensity) {
            case 'mild': return 0.10;
            case 'standard': return 0.20;
            case 'aggressive': return 0.25;
            default: return 0.20;
        }
    }
    if (goalType === 'recomp') {
        return 0.05; // 5% deficit for recomp
    }
    return 0;
}

/**
 * Get surplus calories for bulk
 */
export function getSurplusCalories(goalIntensity: GoalIntensity): number {
    switch (goalIntensity) {
        case 'lean':
        case 'mild': return 200;
        case 'standard': return 300;
        case 'aggressive': return 400;
        default: return 300;
    }
}

/**
 * Calculate goal-adjusted calorie target
 */
export function calculateTargetCalories(
    tdee: number,
    goalType: GoalType,
    goalIntensity: GoalIntensity,
    sex: Sex,
    customDeficitPercent?: number
): { targetCalories: number; deficitOrSurplus: number; deficitPercent: number } {
    let targetCalories = tdee;
    let deficitOrSurplus = 0;
    let deficitPercent = 0;

    switch (goalType) {
        case 'maintenance':
            // No adjustment
            break;

        case 'cut':
            deficitPercent = getDeficitPercent(goalType, goalIntensity, customDeficitPercent);
            deficitOrSurplus = -Math.round(tdee * deficitPercent);
            targetCalories = tdee + deficitOrSurplus;
            break;

        case 'bulk':
            const surplus = getSurplusCalories(goalIntensity);
            deficitOrSurplus = surplus;
            targetCalories = tdee + surplus;
            // Cap at +500
            if (deficitOrSurplus > 500) {
                deficitOrSurplus = 500;
                targetCalories = tdee + 500;
            }
            break;

        case 'recomp':
            deficitPercent = 0.05;
            deficitOrSurplus = -Math.round(tdee * deficitPercent);
            targetCalories = tdee + deficitOrSurplus;
            break;
    }

    // Apply minimum calorie floors
    const minCalories = sex === 'male' ? MIN_CALORIES_MALE : MIN_CALORIES_FEMALE;
    if (targetCalories < minCalories) {
        targetCalories = minCalories;
        deficitOrSurplus = targetCalories - tdee;
    }

    return {
        targetCalories: Math.round(targetCalories),
        deficitOrSurplus,
        deficitPercent: Math.round(deficitPercent * 100)
    };
}

/**
 * Calculate Lean Body Mass (if body fat % is provided)
 */
export function calculateLeanBodyMass(
    weightKg: number,
    bodyFatPercent?: number
): number | null {
    if (bodyFatPercent === undefined || bodyFatPercent === null) {
        return null;
    }
    return weightKg * (1 - bodyFatPercent / 100);
}

/**
 * Calculate macro targets based on goal
 */
export function calculateMacros(
    targetCalories: number,
    weightKg: number,
    goalType: GoalType,
    bodyFatPercent?: number
): { proteinGrams: number; fatGrams: number; carbGrams: number } {
    const leanMass = calculateLeanBodyMass(weightKg, bodyFatPercent);

    // Protein calculation
    let proteinGrams: number;
    if (goalType === 'cut' || goalType === 'recomp') {
        // Higher protein for cutting/recomp: 2.0-2.2g per kg lean mass (or bodyweight if no BF%)
        const proteinBase = leanMass || weightKg;
        proteinGrams = Math.round(proteinBase * 2.0);
    } else if (goalType === 'bulk') {
        // Moderate protein for bulking: 1.8g per kg bodyweight
        proteinGrams = Math.round(weightKg * 1.8);
    } else {
        // Maintenance: 1.6g per kg bodyweight
        proteinGrams = Math.round(weightKg * 1.6);
    }

    // Fat calculation: minimum 0.8g per kg or 25% of calories, whichever is higher
    const fatFromWeight = weightKg * 0.8;
    const fatFrom25Percent = (targetCalories * 0.25) / 9;
    let fatGrams = Math.round(Math.max(fatFromWeight, fatFrom25Percent));

    // Carbs: remaining calories
    const proteinCalories = proteinGrams * 4;
    const fatCalories = fatGrams * 9;
    const remainingCalories = targetCalories - proteinCalories - fatCalories;
    let carbGrams = Math.round(Math.max(0, remainingCalories / 4));

    return { proteinGrams, fatGrams, carbGrams };
}

/**
 * Calculate all nutrition targets at once
 */
export function calculateNutritionTargets(
    weightKg: number,
    heightCm: number,
    age: number,
    sex: Sex,
    activityLevel: ActivityLevel,
    goalType: GoalType,
    goalIntensity: GoalIntensity,
    bodyFatPercent?: number,
    customDeficitPercent?: number
): NutritionTargets & { deficitPercent: number } {
    const bmr = calculateBMR(weightKg, heightCm, age, sex);
    const tdee = calculateTDEE(bmr, activityLevel);
    const { targetCalories, deficitOrSurplus, deficitPercent } = calculateTargetCalories(
        tdee,
        goalType,
        goalIntensity,
        sex,
        customDeficitPercent
    );
    const { proteinGrams, fatGrams, carbGrams } = calculateMacros(
        targetCalories,
        weightKg,
        goalType,
        bodyFatPercent
    );

    return {
        bmr: Math.round(bmr),
        tdee,
        targetCalories,
        proteinGrams,
        fatGrams,
        carbGrams,
        deficitOrSurplus,
        deficitPercent,
    };
}

/**
 * Calculate 7-day rolling average for weight trend
 */
export function calculate7DayRollingAverage(
    weights: { date: string; weight: number }[]
): number | null {
    if (weights.length === 0) return null;

    const sorted = [...weights]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 7);

    if (sorted.length === 0) return null;

    const sum = sorted.reduce((acc, w) => acc + w.weight, 0);
    return Math.round((sum / sorted.length) * 10) / 10;
}

/**
 * Format calorie deficit/surplus for display
 */
export function formatDeficitSurplus(
    goalType: GoalType,
    deficitOrSurplus: number,
    deficitPercent?: number
): string {
    if (goalType === 'maintenance') return 'Maintain';

    if (goalType === 'cut') {
        const percent = deficitPercent || Math.round(Math.abs(deficitOrSurplus) / 100);
        return `Fat Loss | −${percent}%`;
    }

    if (goalType === 'bulk') {
        return `Muscle Gain | +${deficitOrSurplus} kcal`;
    }

    if (goalType === 'recomp') {
        return `Recomp | −5%`;
    }

    return '';
}
