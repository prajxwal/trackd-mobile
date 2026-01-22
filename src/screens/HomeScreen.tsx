import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Typography, Button, Card } from '../components/common';
import { StreakDisplay, StatCard } from '../components/progress';
import { spacing } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { calculateStreak } from '../utils/calculations';
import { Workout, UserSettings } from '../types';
import { format } from 'date-fns';
import {
    Dumbbell,
    TrendingUp,
    Calendar,
    Plus,
} from 'lucide-react-native';

export function HomeScreen({ navigation }: any) {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        if (!user) return;

        try {
            // Fetch workouts
            const { data: workoutsData } = await supabase
                .from('workouts')
                .select('*')
                .eq('user_id', user.id)
                .order('start_time', { ascending: false });

            if (workoutsData) {
                setWorkouts(workoutsData);
            }

            // Fetch settings
            const { data: settingsData } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (settingsData) {
                setSettings(settingsData);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
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

    const streakInfo = calculateStreak(workouts, settings?.rest_days || [0, 6]);
    const thisWeekWorkouts = workouts.filter((w) => {
        const workoutDate = new Date(w.start_time);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return workoutDate >= weekAgo;
    }).length;

    const lastWorkout = workouts[0];

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
            {/* Header */}
            <View style={styles.header}>
                <Typography variant="h2">Welcome back</Typography>
                <Typography variant="body" color={colors.textSecondary}>
                    {format(new Date(), 'EEEE, MMMM d')}
                </Typography>
            </View>

            {/* Streak */}
            <StreakDisplay
                currentStreak={streakInfo.currentStreak}
                longestStreak={streakInfo.longestStreak}
            />

            {/* Quick Stats */}
            <View style={styles.statsRow}>
                <StatCard
                    title="This Week"
                    value={thisWeekWorkouts}
                    subtitle="workouts"
                    icon={<Calendar size={14} color={colors.textSecondary} />}
                />
                <View style={{ width: spacing.md }} />
                <StatCard
                    title="Total"
                    value={workouts.length}
                    subtitle="workouts"
                    icon={<Dumbbell size={14} color={colors.textSecondary} />}
                />
            </View>

            {/* Start Workout Button */}
            <Button
                title="Start Workout"
                onPress={() => navigation.navigate('ActiveWorkout')}
                icon={<Plus size={20} color={colors.background} style={{ marginRight: spacing.xs }} />}
                fullWidth
                size="large"
                style={styles.startButton}
            />

            {/* Last Workout */}
            {lastWorkout && (
                <View style={styles.section}>
                    <Typography variant="h3" style={styles.sectionTitle}>
                        Last Workout
                    </Typography>
                    <TouchableOpacity
                        onPress={() =>
                            navigation.navigate('WorkoutDetail', { workoutId: lastWorkout.id })
                        }
                    >
                        <Card>
                            <View style={styles.lastWorkoutHeader}>
                                <Typography variant="body" bold>
                                    {format(new Date(lastWorkout.start_time), 'EEEE, MMM d')}
                                </Typography>
                                <TrendingUp size={16} color={colors.textSecondary} />
                            </View>
                            {lastWorkout.end_time && (
                                <Typography variant="bodySmall" color={colors.textSecondary}>
                                    Duration:{' '}
                                    {Math.round(
                                        (new Date(lastWorkout.end_time).getTime() -
                                            new Date(lastWorkout.start_time).getTime()) /
                                        60000
                                    )}{' '}
                                    min
                                </Typography>
                            )}
                            {lastWorkout.notes && (
                                <Typography
                                    variant="bodySmall"
                                    color={colors.textSecondary}
                                    style={styles.notes}
                                    numberOfLines={2}
                                >
                                    {lastWorkout.notes}
                                </Typography>
                            )}
                        </Card>
                    </TouchableOpacity>
                </View>
            )}
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
    header: {
        marginBottom: spacing.lg,
    },
    statsRow: {
        flexDirection: 'row',
        marginTop: spacing.md,
    },
    startButton: {
        marginTop: spacing.lg,
    },
    section: {
        marginTop: spacing.xl,
    },
    sectionTitle: {
        marginBottom: spacing.sm,
    },
    lastWorkoutHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    notes: {
        marginTop: spacing.xs,
    },
});
