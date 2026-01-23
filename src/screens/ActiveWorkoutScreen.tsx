import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    TextInput,
    SafeAreaView,
    Platform,
    StatusBar,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Typography, Button, Card, Input } from '../components/common';
import { spacing, fontFamily, fontSize, borderRadius } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { Exercise, WorkoutSet } from '../types';
import { defaultExercises } from '../data/exercises';
import { formatDuration } from '../utils/calculations';
import {
    Plus,
    Minus,
    X,
    Check,
    Clock,
    Copy,
    Trash2,
} from 'lucide-react-native';

interface ActiveSet {
    id: string;
    exercise: Exercise;
    reps: string;
    weight: string;
    duration: string;
    distance: string;
}

export function ActiveWorkoutScreen({ navigation }: any) {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [sets, setSets] = useState<ActiveSet[]>([]);
    const [notes, setNotes] = useState('');
    const [duration, setDuration] = useState(0);
    const [showExercisePicker, setShowExercisePicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const timerRef = useRef<NodeJS.Timeout>();
    const startTimeRef = useRef(new Date());

    useEffect(() => {
        fetchExercises();
        startTimeRef.current = new Date();
        timerRef.current = setInterval(() => {
            setDuration((prev) => prev + 1);
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const fetchExercises = async () => {
        if (!user) return;

        // Get custom exercises from Supabase
        const { data } = await supabase
            .from('exercises')
            .select('*')
            .or(`user_id.eq.${user.id},is_custom.eq.false`);

        if (data && data.length > 0) {
            setExercises(data);
        } else {
            // Use default exercises if none in database
            setExercises(
                defaultExercises.map((e, i) => ({
                    ...e,
                    id: `default-${i}`,
                    user_id: undefined,
                })) as Exercise[]
            );
        }
    };

    const addSet = (exercise: Exercise) => {
        const lastSetOfExercise = [...sets]
            .reverse()
            .find((s) => s.exercise.id === exercise.id);

        setSets([
            ...sets,
            {
                id: `${Date.now()}-${Math.random()}`,
                exercise,
                reps: lastSetOfExercise?.reps || '',
                weight: lastSetOfExercise?.weight || '',
                duration: '',
                distance: '',
            },
        ]);
        setShowExercisePicker(false);
        setSearchQuery('');
    };

    const updateSet = (id: string, field: keyof ActiveSet, value: string) => {
        setSets(sets.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
    };

    const duplicateSet = (set: ActiveSet) => {
        const index = sets.findIndex((s) => s.id === set.id);
        const newSet = {
            ...set,
            id: `${Date.now()}-${Math.random()}`,
        };
        const newSets = [...sets];
        newSets.splice(index + 1, 0, newSet);
        setSets(newSets);
    };

    const removeSet = (id: string) => {
        setSets(sets.filter((s) => s.id !== id));
    };

    const finishWorkout = async () => {
        if (sets.length === 0) {
            Alert.alert('Empty Workout', 'Add at least one set before finishing.');
            return;
        }

        try {
            // Create workout
            const { data: workout, error: workoutError } = await supabase
                .from('workouts')
                .insert({
                    user_id: user?.id,
                    start_time: startTimeRef.current.toISOString(),
                    end_time: new Date().toISOString(),
                    notes: notes || null,
                })
                .select()
                .single();

            if (workoutError) throw workoutError;

            // Create sets
            const setsToInsert = sets.map((set, index) => ({
                workout_id: workout.id,
                exercise_id: set.exercise.id.startsWith('default-') ? null : set.exercise.id,
                set_number: index + 1,
                reps: set.reps ? parseInt(set.reps) : null,
                weight: set.weight ? parseFloat(set.weight) : null,
                duration: set.duration ? parseInt(set.duration) : null,
                distance: set.distance ? parseFloat(set.distance) : null,
            }));

            await supabase.from('workout_sets').insert(setsToInsert);

            navigation.goBack();
        } catch (error) {
            console.error('Error saving workout:', error);
            Alert.alert('Error', 'Failed to save workout. Please try again.');
        }
    };

    const cancelWorkout = () => {
        Alert.alert(
            'Discard Workout?',
            'Are you sure you want to discard this workout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Discard',
                    style: 'destructive',
                    onPress: () => navigation.goBack(),
                },
            ]
        );
    };

    const filteredExercises = exercises.filter((e) =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedSets = sets.reduce((acc, set) => {
        const key = set.exercise.id;
        if (!acc[key]) {
            acc[key] = { exercise: set.exercise, sets: [] };
        }
        acc[key].sets.push(set);
        return acc;
    }, {} as Record<string, { exercise: Exercise; sets: ActiveSet[] }>);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
                <TouchableOpacity onPress={cancelWorkout} style={styles.headerButton}>
                    <X size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.timerContainer}>
                    <Clock size={16} color={colors.text} />
                    <Typography variant="body" bold style={styles.timer}>
                        {formatDuration(duration)}
                    </Typography>
                </View>
                <TouchableOpacity onPress={finishWorkout} style={styles.headerButton}>
                    <Check size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Sets grouped by exercise */}
                {Object.values(groupedSets).map(({ exercise, sets: exerciseSets }) => (
                    <Card key={exercise.id} style={styles.exerciseCard}>
                        <Typography variant="body" bold>
                            {exercise.name}
                        </Typography>
                        <Typography variant="caption" color={colors.textSecondary}>
                            {exercise.category}
                        </Typography>

                        {exerciseSets.map((set, index) => (
                            <View key={set.id} style={styles.setRow}>
                                <Typography
                                    variant="bodySmall"
                                    color={colors.textSecondary}
                                    style={styles.setNumber}
                                >
                                    {index + 1}
                                </Typography>

                                {exercise.category === 'strength' ? (
                                    <>
                                        <TextInput
                                            style={[
                                                styles.setInput,
                                                {
                                                    backgroundColor: colors.surface,
                                                    borderColor: colors.border,
                                                    color: colors.text,
                                                },
                                            ]}
                                            placeholder="kg"
                                            placeholderTextColor={colors.textSecondary}
                                            value={set.weight}
                                            onChangeText={(v) => updateSet(set.id, 'weight', v)}
                                            keyboardType="numeric"
                                        />
                                        <Typography variant="caption" color={colors.textSecondary}>
                                            ×
                                        </Typography>
                                        <TextInput
                                            style={[
                                                styles.setInput,
                                                {
                                                    backgroundColor: colors.surface,
                                                    borderColor: colors.border,
                                                    color: colors.text,
                                                },
                                            ]}
                                            placeholder="reps"
                                            placeholderTextColor={colors.textSecondary}
                                            value={set.reps}
                                            onChangeText={(v) => updateSet(set.id, 'reps', v)}
                                            keyboardType="numeric"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <TextInput
                                            style={[
                                                styles.setInput,
                                                {
                                                    backgroundColor: colors.surface,
                                                    borderColor: colors.border,
                                                    color: colors.text,
                                                },
                                            ]}
                                            placeholder="min"
                                            placeholderTextColor={colors.textSecondary}
                                            value={set.duration}
                                            onChangeText={(v) => updateSet(set.id, 'duration', v)}
                                            keyboardType="numeric"
                                        />
                                        <TextInput
                                            style={[
                                                styles.setInput,
                                                {
                                                    backgroundColor: colors.surface,
                                                    borderColor: colors.border,
                                                    color: colors.text,
                                                },
                                            ]}
                                            placeholder="km"
                                            placeholderTextColor={colors.textSecondary}
                                            value={set.distance}
                                            onChangeText={(v) => updateSet(set.id, 'distance', v)}
                                            keyboardType="numeric"
                                        />
                                    </>
                                )}

                                <TouchableOpacity
                                    onPress={() => duplicateSet(set)}
                                    style={styles.setAction}
                                >
                                    <Copy size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => removeSet(set.id)}
                                    style={styles.setAction}
                                >
                                    <Trash2 size={16} color={colors.error} />
                                </TouchableOpacity>
                            </View>
                        ))}

                        <Button
                            title="Add Set"
                            variant="ghost"
                            size="small"
                            onPress={() => addSet(exercise)}
                            icon={<Plus size={14} color={colors.text} />}
                            style={styles.addSetButton}
                        />
                    </Card>
                ))}

                {/* Notes */}
                <Card style={styles.notesCard}>
                    <Typography variant="bodySmall" color={colors.textSecondary}>
                        Notes
                    </Typography>
                    <TextInput
                        style={[
                            styles.notesInput,
                            {
                                color: colors.text,
                                fontFamily: fontFamily.regular,
                            },
                        ]}
                        placeholder="Add workout notes..."
                        placeholderTextColor={colors.textSecondary}
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                    />
                </Card>

                {/* Add Exercise Button */}
                <Button
                    title="Add Exercise"
                    variant="outline"
                    onPress={() => setShowExercisePicker(true)}
                    icon={<Plus size={16} color={colors.text} style={{ marginRight: spacing.xs }} />}
                    fullWidth
                    style={styles.addExerciseButton}
                />
            </ScrollView>

            {/* Exercise Picker Modal */}
            {showExercisePicker && (
                <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
                        <Typography variant="h3">Add Exercise</Typography>
                        <TouchableOpacity onPress={() => setShowExercisePicker(false)} style={styles.headerButton}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <Input
                        placeholder="Search exercises..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        containerStyle={styles.searchInput}
                    />
                    <ScrollView>
                        {filteredExercises.map((exercise) => (
                            <TouchableOpacity
                                key={exercise.id}
                                style={[styles.exerciseItem, { borderBottomColor: colors.border }]}
                                onPress={() => addSet(exercise)}
                            >
                                <Typography variant="body">{exercise.name}</Typography>
                                <Typography variant="caption" color={colors.textSecondary}>
                                    {exercise.muscle_groups.join(', ')}
                                </Typography>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </SafeAreaView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
    },
    headerButton: {
        padding: spacing.xs,
        minWidth: 40,
        minHeight: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timer: {
        marginLeft: spacing.xs,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    exerciseCard: {
        marginBottom: spacing.md,
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    setNumber: {
        width: 24,
    },
    setInput: {
        flex: 1,
        borderWidth: 1,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        marginHorizontal: spacing.xs,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
        textAlign: 'center',
    },
    setAction: {
        padding: spacing.xs,
    },
    addSetButton: {
        marginTop: spacing.sm,
        alignSelf: 'flex-start',
    },
    notesCard: {
        marginBottom: spacing.md,
    },
    notesInput: {
        marginTop: spacing.xs,
        fontSize: fontSize.md,
        minHeight: 60,
    },
    addExerciseButton: {
        marginBottom: spacing.xl,
    },
    modal: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
    },
    searchInput: {
        margin: spacing.md,
        marginBottom: 0,
    },
    exerciseItem: {
        padding: spacing.md,
        borderBottomWidth: 1,
    },
});
