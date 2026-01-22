import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Typography, Card } from '../components/common';
import { StreakDisplay, StatCard } from '../components/progress';
import { spacing } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { calculateStreak, calculateVolume } from '../utils/calculations';
import { Workout, WorkoutSet } from '../types';
import { startOfWeek, startOfMonth, subMonths, format, eachDayOfInterval, startOfDay } from 'date-fns';
import { Dumbbell, TrendingUp, Target, Calendar } from 'lucide-react-native';

type TimePeriod = 'week' | 'month' | '3months' | '6months' | 'year' | 'all';

export function ProgressScreen({ navigation }: any) {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [period, setPeriod] = useState<TimePeriod>('month');

    const fetchData = async () => {
        if (!user) return;

        try {
            const { data } = await supabase
                .from('workouts')
                .select(`*, sets:workout_sets(*)`)
                .eq('user_id', user.id)
                .order('start_time', { ascending: false });

            if (data) {
                setWorkouts(data);
            }
        } catch (error) {
            console.error('Error fetching progress data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const getFilteredWorkouts = () => {
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case 'week':
                startDate = startOfWeek(now);
                break;
            case 'month':
                startDate = startOfMonth(now);
                break;
            case '3months':
                startDate = subMonths(now, 3);
                break;
            case '6months':
                startDate = subMonths(now, 6);
                break;
            case 'year':
                startDate = subMonths(now, 12);
                break;
            default:
                return workouts;
        }

        return workouts.filter((w) => new Date(w.start_time) >= startDate);
    };

    const filteredWorkouts = getFilteredWorkouts();
    const streakInfo = calculateStreak(workouts);

    const totalVolume = filteredWorkouts.reduce((total, workout) => {
        if (!workout.sets) return total;
        return total + calculateVolume(workout.sets as WorkoutSet[]);
    }, 0);

    const avgWorkoutsPerWeek = period === 'all'
        ? 0
        : (filteredWorkouts.length / (period === 'week' ? 1 : period === 'month' ? 4 : period === '3months' ? 12 : period === '6months' ? 24 : 52));

    // Generate heatmap data (last 12 weeks)
    const generateHeatmap = () => {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 84); // 12 weeks

        const days = eachDayOfInterval({ start: startDate, end: today });
        const workoutDates = new Set(
            workouts.map((w) => format(new Date(w.start_time), 'yyyy-MM-dd'))
        );

        return days.map((day) => ({
            date: day,
            hasWorkout: workoutDates.has(format(day, 'yyyy-MM-dd')),
        }));
    };

    const heatmapData = generateHeatmap();
    const weeks: typeof heatmapData[] = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
        weeks.push(heatmapData.slice(i, i + 7));
    }

    const periods: { key: TimePeriod; label: string }[] = [
        { key: 'week', label: 'W' },
        { key: 'month', label: 'M' },
        { key: '3months', label: '3M' },
        { key: '6months', label: '6M' },
        { key: 'year', label: 'Y' },
        { key: 'all', label: 'All' },
    ];

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.text}
                />
            }
        >
            {/* Streak */}
            <StreakDisplay
                currentStreak={streakInfo.currentStreak}
                longestStreak={streakInfo.longestStreak}
            />

            {/* Period Selector */}
            <View style={styles.periodSelector}>
                {periods.map((p) => (
                    <TouchableOpacity
                        key={p.key}
                        style={[
                            styles.periodButton,
                            {
                                backgroundColor: period === p.key ? colors.text : 'transparent',
                                borderColor: colors.border,
                            },
                        ]}
                        onPress={() => setPeriod(p.key)}
                    >
                        <Typography
                            variant="caption"
                            color={period === p.key ? colors.background : colors.text}
                        >
                            {p.label}
                        </Typography>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <StatCard
                    title="Workouts"
                    value={filteredWorkouts.length}
                    icon={<Dumbbell size={14} color={colors.textSecondary} />}
                />
                <View style={{ width: spacing.md }} />
                <StatCard
                    title="Volume"
                    value={`${Math.round(totalVolume / 1000)}k`}
                    subtitle="kg lifted"
                    icon={<TrendingUp size={14} color={colors.textSecondary} />}
                />
            </View>
            <View style={[styles.statsGrid, { marginTop: spacing.md }]}>
                <StatCard
                    title="Avg/Week"
                    value={avgWorkoutsPerWeek.toFixed(1)}
                    subtitle="workouts"
                    icon={<Calendar size={14} color={colors.textSecondary} />}
                />
                <View style={{ width: spacing.md }} />
                <StatCard
                    title="Best Streak"
                    value={streakInfo.longestStreak}
                    subtitle="days"
                    icon={<Target size={14} color={colors.textSecondary} />}
                />
            </View>

            {/* Calendar Heatmap */}
            <Card style={styles.heatmapCard}>
                <Typography variant="body" bold style={styles.heatmapTitle}>
                    Activity
                </Typography>
                <View style={styles.heatmap}>
                    {weeks.map((week, weekIndex) => (
                        <View key={weekIndex} style={styles.heatmapWeek}>
                            {week.map((day, dayIndex) => (
                                <View
                                    key={dayIndex}
                                    style={[
                                        styles.heatmapDay,
                                        {
                                            backgroundColor: day.hasWorkout
                                                ? colors.text
                                                : colors.surface,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                />
                            ))}
                        </View>
                    ))}
                </View>
                <View style={styles.heatmapLegend}>
                    <Typography variant="caption" color={colors.textSecondary}>
                        Less
                    </Typography>
                    <View style={[styles.legendBox, { backgroundColor: colors.surface, borderColor: colors.border }]} />
                    <View style={[styles.legendBox, { backgroundColor: colors.text }]} />
                    <Typography variant="caption" color={colors.textSecondary}>
                        More
                    </Typography>
                </View>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: spacing.md,
    },
    periodSelector: {
        flexDirection: 'row',
        marginTop: spacing.lg,
        marginBottom: spacing.md,
    },
    periodButton: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderWidth: 1,
    },
    statsGrid: {
        flexDirection: 'row',
    },
    heatmapCard: {
        marginTop: spacing.lg,
    },
    heatmapTitle: {
        marginBottom: spacing.md,
    },
    heatmap: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    heatmapWeek: {
        flexDirection: 'column',
    },
    heatmapDay: {
        width: 16,
        height: 16,
        margin: 1,
        borderWidth: 1,
    },
    heatmapLegend: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: spacing.sm,
        gap: spacing.xs,
    },
    legendBox: {
        width: 12,
        height: 12,
        borderWidth: 1,
    },
});
