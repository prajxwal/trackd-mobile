import { isSameDay, subDays, startOfDay } from 'date-fns';
import { Workout } from '../types';

/**
 * Calculate the current workout streak
 * Rest days (by default weekends) don't break the streak
 */
export function calculateStreak(
    workouts: Workout[],
    restDays: number[] = [0, 6] // Sunday = 0, Saturday = 6
): { currentStreak: number; longestStreak: number } {
    if (workouts.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
    }

    // Sort workouts by date descending
    const sortedWorkouts = [...workouts].sort(
        (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );

    // Get unique workout dates
    const workoutDates = new Set(
        sortedWorkouts.map((w) => startOfDay(new Date(w.start_time)).toISOString())
    );

    let currentStreak = 0;
    let date = startOfDay(new Date());

    // Count current streak going backwards from today
    // The logic: for each day going backwards:
    // - If it's a rest day, skip it (don't break streak, don't add to streak)
    // - If it's a workout day, add to streak
    // - If it's a non-rest day WITHOUT a workout, the streak is broken

    let daysChecked = 0;
    const MAX_DAYS_TO_CHECK = 365;

    while (daysChecked < MAX_DAYS_TO_CHECK) {
        const dateStr = startOfDay(date).toISOString();
        const dayOfWeek = date.getDay();
        const isRestDay = restDays.includes(dayOfWeek);
        const hasWorkout = workoutDates.has(dateStr);

        if (isRestDay) {
            // Rest days don't count for or against the streak
            date = subDays(date, 1);
            daysChecked++;
            continue;
        }

        if (hasWorkout) {
            // Workout on a non-rest day - increment streak
            currentStreak++;
            date = subDays(date, 1);
            daysChecked++;
        } else {
            // Non-rest day without workout - streak is broken
            // BUT: if we haven't found ANY workouts yet (currentStreak is 0),
            // we need to check if there's a recent workout we should count
            if (currentStreak === 0) {
                // No workouts counted yet - streak is simply 0
                break;
            }
            // We were counting and hit a gap - streak ends
            break;
        }
    }

    const longestStreak = calculateLongestStreak(workoutDates, restDays);

    return {
        currentStreak,
        longestStreak: Math.max(currentStreak, longestStreak),
    };
}

function calculateLongestStreak(
    workoutDates: Set<string>,
    restDays: number[]
): number {
    if (workoutDates.size === 0) return 0;

    const dates = Array.from(workoutDates)
        .map((d) => new Date(d))
        .sort((a, b) => a.getTime() - b.getTime());

    let longestStreak = 0;
    let currentStreak = 0;
    let lastDate: Date | null = null;

    for (const date of dates) {
        if (!lastDate) {
            currentStreak = 1;
            lastDate = date;
            continue;
        }

        let expectedDate = subDays(date, 1);
        let daysSkipped = 0;

        // Check if we can skip rest days
        while (restDays.includes(expectedDate.getDay()) && daysSkipped < 7) {
            expectedDate = subDays(expectedDate, 1);
            daysSkipped++;
        }

        if (isSameDay(lastDate, expectedDate) || isSameDay(lastDate, subDays(date, 1))) {
            currentStreak++;
        } else {
            longestStreak = Math.max(longestStreak, currentStreak);
            currentStreak = 1;
        }

        lastDate = date;
    }

    return Math.max(longestStreak, currentStreak);
}

/**
 * Calculate total volume (weight × reps × sets)
 */
export function calculateVolume(
    sets: { weight?: number; reps?: number }[]
): number {
    return sets.reduce((total, set) => {
        if (set.weight && set.reps) {
            return total + set.weight * set.reps;
        }
        return total;
    }, 0);
}

/**
 * Calculate estimated 1RM using Epley formula
 */
export function calculateEstimated1RM(weight: number, reps: number): number {
    if (reps === 1) return weight;
    if (reps === 0 || weight === 0) return 0;
    return Math.round(weight * (1 + reps / 30));
}

/**
 * Format duration in seconds to readable string
 */
export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
}

/**
 * Format weight with units
 */
export function formatWeight(
    weight: number,
    units: 'metric' | 'imperial'
): string {
    return `${weight} ${units === 'metric' ? 'kg' : 'lbs'}`;
}

/**
 * Convert between units
 */
export function convertWeight(
    weight: number,
    from: 'metric' | 'imperial',
    to: 'metric' | 'imperial'
): number {
    if (from === to) return weight;
    if (from === 'metric' && to === 'imperial') {
        return Math.round(weight * 2.20462 * 10) / 10;
    }
    return Math.round(weight / 2.20462 * 10) / 10;
}
