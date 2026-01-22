import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Typography, Card, Button } from '../components/common';
import { spacing } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { Workout } from '../types';
import { format } from 'date-fns';
import { Plus, ChevronRight, Clock } from 'lucide-react-native';

export function WorkoutsScreen({ navigation }: any) {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchWorkouts = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('workouts')
                .select(`
          *,
          sets:workout_sets(
            *,
            exercise:exercises(*)
          )
        `)
                .eq('user_id', user.id)
                .order('start_time', { ascending: false });

            if (data) {
                setWorkouts(data);
            }
        } catch (error) {
            console.error('Error fetching workouts:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchWorkouts();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchWorkouts();
    };

    const getDuration = (workout: Workout) => {
        if (!workout.end_time) return null;
        const duration = Math.round(
            (new Date(workout.end_time).getTime() -
                new Date(workout.start_time).getTime()) /
            60000
        );
        return `${duration} min`;
    };

    const getExerciseCount = (workout: Workout) => {
        if (!workout.sets) return 0;
        const uniqueExercises = new Set(workout.sets.map((s) => s.exercise_id));
        return uniqueExercises.size;
    };

    const renderWorkout = ({ item }: { item: Workout }) => (
        <TouchableOpacity
            onPress={() => navigation.navigate('WorkoutDetail', { workoutId: item.id })}
        >
            <Card style={styles.workoutCard}>
                <View style={styles.workoutHeader}>
                    <View>
                        <Typography variant="body" bold>
                            {format(new Date(item.start_time), 'EEEE, MMM d')}
                        </Typography>
                        <Typography variant="caption" color={colors.textSecondary}>
                            {format(new Date(item.start_time), 'h:mm a')}
                        </Typography>
                    </View>
                    <ChevronRight size={20} color={colors.textSecondary} />
                </View>
                <View style={styles.workoutStats}>
                    {getDuration(item) && (
                        <View style={styles.stat}>
                            <Clock size={12} color={colors.textSecondary} />
                            <Typography
                                variant="bodySmall"
                                color={colors.textSecondary}
                                style={styles.statText}
                            >
                                {getDuration(item)}
                            </Typography>
                        </View>
                    )}
                    <Typography variant="bodySmall" color={colors.textSecondary}>
                        {getExerciseCount(item)} exercises • {item.sets?.length || 0} sets
                    </Typography>
                </View>
                {item.notes && (
                    <Typography
                        variant="caption"
                        color={colors.textSecondary}
                        numberOfLines={1}
                        style={styles.notes}
                    >
                        {item.notes}
                    </Typography>
                )}
            </Card>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                data={workouts}
                renderItem={renderWorkout}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.text}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Typography variant="body" color={colors.textSecondary} center>
                            No workouts yet
                        </Typography>
                        <Typography
                            variant="bodySmall"
                            color={colors.textSecondary}
                            center
                            style={styles.emptySubtext}
                        >
                            Start your first workout to see it here
                        </Typography>
                    </View>
                }
            />
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.text }]}
                onPress={() => navigation.navigate('ActiveWorkout')}
            >
                <Plus size={24} color={colors.background} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    list: {
        padding: spacing.md,
    },
    workoutCard: {
        marginBottom: spacing.md,
    },
    workoutHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    workoutStats: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    statText: {
        marginLeft: spacing.xs,
    },
    notes: {
        marginTop: spacing.xs,
    },
    empty: {
        padding: spacing.xxl,
        alignItems: 'center',
    },
    emptySubtext: {
        marginTop: spacing.sm,
    },
    fab: {
        position: 'absolute',
        right: spacing.md,
        bottom: spacing.md,
        width: 56,
        height: 56,
        borderRadius: 0, // Straight lines
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
});
