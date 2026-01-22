import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Typography, Card } from '../components/common';
import { spacing } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { Workout, WorkoutSet, Exercise } from '../types';
import { format } from 'date-fns';
import { formatDuration, calculateVolume } from '../utils/calculations';
import { Clock, Dumbbell, TrendingUp } from 'lucide-react-native';

export function WorkoutDetailScreen({ route }: any) {
    const { workoutId } = route.params;
    const { colors } = useTheme();
    const { user } = useAuth();
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWorkout();
    }, [workoutId]);

    const fetchWorkout = async () => {
        try {
            const { data } = await supabase
                .from('workouts')
                .select(`
          *,
          sets:workout_sets(
            *,
            exercise:exercises(*)
          )
        `)
                .eq('id', workoutId)
                .single();

            if (data) {
                setWorkout(data);
            }
        } catch (error) {
            console.error('Error fetching workout:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !workout) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Typography variant="body" color={colors.textSecondary} center>
                    Loading...
                </Typography>
            </View>
        );
    }

    const duration = workout.end_time
        ? Math.round(
            (new Date(workout.end_time).getTime() -
                new Date(workout.start_time).getTime()) /
            1000
        )
        : 0;

    const totalVolume = calculateVolume(workout.sets || []);

    // Group sets by exercise
    const groupedSets = (workout.sets || []).reduce((acc, set) => {
        const exerciseName = set.exercise?.name || 'Unknown';
        if (!acc[exerciseName]) {
            acc[exerciseName] = {
                exercise: set.exercise,
                sets: [],
            };
        }
        acc[exerciseName].sets.push(set);
        return acc;
    }, {} as Record<string, { exercise: Exercise | undefined; sets: WorkoutSet[] }>);

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Typography variant="h2">
                        {format(new Date(workout.start_time), 'EEEE')}
                    </Typography>
                    <Typography variant="body" color={colors.textSecondary}>
                        {format(new Date(workout.start_time), 'MMMM d, yyyy • h:mm a')}
                    </Typography>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <Card style={styles.statCard}>
                        <Clock size={16} color={colors.textSecondary} />
                        <Typography variant="h3" bold style={styles.statValue}>
                            {formatDuration(duration)}
                        </Typography>
                        <Typography variant="caption" color={colors.textSecondary}>
                            Duration
                        </Typography>
                    </Card>
                    <Card style={styles.statCard}>
                        <Dumbbell size={16} color={colors.textSecondary} />
                        <Typography variant="h3" bold style={styles.statValue}>
                            {workout.sets?.length || 0}
                        </Typography>
                        <Typography variant="caption" color={colors.textSecondary}>
                            Sets
                        </Typography>
                    </Card>
                    <Card style={styles.statCard}>
                        <TrendingUp size={16} color={colors.textSecondary} />
                        <Typography variant="h3" bold style={styles.statValue}>
                            {Math.round(totalVolume)}
                        </Typography>
                        <Typography variant="caption" color={colors.textSecondary}>
                            Volume (kg)
                        </Typography>
                    </Card>
                </View>

                {/* Exercises */}
                {Object.entries(groupedSets).map(([exerciseName, { exercise, sets }]) => (
                    <Card key={exerciseName} style={styles.exerciseCard}>
                        <Typography variant="body" bold>
                            {exerciseName}
                        </Typography>
                        {exercise && (
                            <Typography variant="caption" color={colors.textSecondary}>
                                {exercise.muscle_groups?.join(', ')}
                            </Typography>
                        )}
                        <View style={styles.setsHeader}>
                            <Typography variant="caption" color={colors.textSecondary} style={styles.setCol}>
                                Set
                            </Typography>
                            <Typography variant="caption" color={colors.textSecondary} style={styles.weightCol}>
                                Weight
                            </Typography>
                            <Typography variant="caption" color={colors.textSecondary} style={styles.repsCol}>
                                Reps
                            </Typography>
                        </View>
                        {sets.map((set, index) => (
                            <View key={set.id} style={styles.setRow}>
                                <Typography variant="body" style={styles.setCol}>
                                    {index + 1}
                                </Typography>
                                <Typography variant="body" style={styles.weightCol}>
                                    {set.weight ? `${set.weight} kg` : '-'}
                                </Typography>
                                <Typography variant="body" style={styles.repsCol}>
                                    {set.reps || '-'}
                                </Typography>
                            </View>
                        ))}
                    </Card>
                ))}

                {/* Notes */}
                {workout.notes && (
                    <Card style={styles.notesCard}>
                        <Typography variant="bodySmall" color={colors.textSecondary}>
                            Notes
                        </Typography>
                        <Typography variant="body" style={styles.notesText}>
                            {workout.notes}
                        </Typography>
                    </Card>
                )}
            </View>
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
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        marginVertical: spacing.xs,
    },
    exerciseCard: {
        marginBottom: spacing.md,
    },
    setsHeader: {
        flexDirection: 'row',
        marginTop: spacing.md,
        paddingBottom: spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    setRow: {
        flexDirection: 'row',
        paddingVertical: spacing.xs,
    },
    setCol: {
        width: 40,
    },
    weightCol: {
        flex: 1,
    },
    repsCol: {
        width: 60,
        textAlign: 'right',
    },
    notesCard: {
        marginTop: spacing.md,
    },
    notesText: {
        marginTop: spacing.xs,
    },
});
