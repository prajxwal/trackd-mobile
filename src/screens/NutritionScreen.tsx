import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    TextInput,
    Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Typography, Button, Card } from '../components/common';
import { spacing, fontFamily, fontSize, borderRadius } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { FoodEntry, UserSettings } from '../types';
import { format, startOfDay } from 'date-fns';
import { mealTypes } from '../data/exercises';
import {
    Plus,
    ChevronLeft,
    ChevronRight,
    X,
    Coffee,
    Sun,
    Moon,
    Cookie,
    Trash2,
} from 'lucide-react-native';

const mealIcons: Record<string, React.ReactNode> = {
    breakfast: <Coffee size={16} />,
    lunch: <Sun size={16} />,
    dinner: <Moon size={16} />,
    snack: <Cookie size={16} />,
};

export function NutritionScreen({ navigation }: any) {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [entries, setEntries] = useState<FoodEntry[]>([]);
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedMealType, setSelectedMealType] = useState<string>('breakfast');

    // Add food form
    const [foodName, setFoodName] = useState('');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fat, setFat] = useState('');
    const [servingSize, setServingSize] = useState('');

    const fetchData = async () => {
        if (!user) return;

        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');

            const { data: entriesData } = await supabase
                .from('food_entries')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', dateStr)
                .order('created_at', { ascending: true });

            if (entriesData) {
                setEntries(entriesData);
            }

            const { data: settingsData } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (settingsData) {
                setSettings(settingsData);
            }
        } catch (error) {
            console.error('Error fetching nutrition data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user, selectedDate]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    const totals = entries.reduce(
        (acc, entry) => ({
            calories: acc.calories + (entry.calories || 0),
            protein: acc.protein + (entry.protein || 0),
            carbs: acc.carbs + (entry.carbs || 0),
            fat: acc.fat + (entry.fat || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const calorieGoal = settings?.calorie_goal || 2000;
    const proteinGoal = settings?.protein_goal || 150;

    const addFoodEntry = async () => {
        if (!foodName.trim()) {
            Alert.alert('Error', 'Please enter a food name');
            return;
        }

        try {
            await supabase.from('food_entries').insert({
                user_id: user?.id,
                date: format(selectedDate, 'yyyy-MM-dd'),
                meal_type: selectedMealType,
                food_name: foodName.trim(),
                calories: calories ? parseInt(calories) : null,
                protein: protein ? parseFloat(protein) : null,
                carbs: carbs ? parseFloat(carbs) : null,
                fat: fat ? parseFloat(fat) : null,
                serving_size: servingSize.trim() || null,
            });

            // Reset form
            setFoodName('');
            setCalories('');
            setProtein('');
            setCarbs('');
            setFat('');
            setServingSize('');
            setShowAddModal(false);
            fetchData();
        } catch (error) {
            console.error('Error adding food entry:', error);
            Alert.alert('Error', 'Failed to add food entry');
        }
    };

    const deleteFoodEntry = async (id: string) => {
        try {
            await supabase.from('food_entries').delete().eq('id', id);
            fetchData();
        } catch (error) {
            console.error('Error deleting entry:', error);
        }
    };

    const groupedEntries = mealTypes.reduce((acc, mealType) => {
        acc[mealType] = entries.filter((e) => e.meal_type === mealType);
        return acc;
    }, {} as Record<string, FoodEntry[]>);

    const MacroBar = ({
        label,
        current,
        goal,
        color,
    }: {
        label: string;
        current: number;
        goal: number;
        color: string;
    }) => {
        const percentage = Math.min((current / goal) * 100, 100);
        return (
            <View style={styles.macroBar}>
                <View style={styles.macroHeader}>
                    <Typography variant="caption" color={colors.textSecondary}>
                        {label}
                    </Typography>
                    <Typography variant="caption">
                        {Math.round(current)}/{goal}
                    </Typography>
                </View>
                <View style={[styles.macroTrack, { backgroundColor: colors.border }]}>
                    <View
                        style={[
                            styles.macroFill,
                            { width: `${percentage}%`, backgroundColor: colors.text },
                        ]}
                    />
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Date Selector */}
            <View style={[styles.dateSelector, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => changeDate(-1)}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSelectedDate(new Date())}>
                    <Typography variant="body" bold>
                        {format(selectedDate, 'EEEE, MMM d')}
                    </Typography>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => changeDate(1)}>
                    <ChevronRight size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.text}
                    />
                }
            >
                {/* Summary Card */}
                <Card style={styles.summaryCard}>
                    <View style={styles.caloriesRow}>
                        <View>
                            <Typography variant="display" bold>
                                {totals.calories}
                            </Typography>
                            <Typography variant="caption" color={colors.textSecondary}>
                                of {calorieGoal} kcal
                            </Typography>
                        </View>
                        <View style={styles.caloriesRemaining}>
                            <Typography variant="h2" bold>
                                {calorieGoal - totals.calories}
                            </Typography>
                            <Typography variant="caption" color={colors.textSecondary}>
                                remaining
                            </Typography>
                        </View>
                    </View>

                    <MacroBar
                        label="Protein"
                        current={totals.protein}
                        goal={proteinGoal}
                        color={colors.text}
                    />
                    <MacroBar
                        label="Carbs"
                        current={totals.carbs}
                        goal={250}
                        color={colors.text}
                    />
                    <MacroBar
                        label="Fat"
                        current={totals.fat}
                        goal={65}
                        color={colors.text}
                    />
                </Card>

                {/* Meal Groups */}
                {mealTypes.map((mealType) => (
                    <View key={mealType} style={styles.mealSection}>
                        <View style={styles.mealHeader}>
                            <View style={styles.mealTitle}>
                                {React.cloneElement(mealIcons[mealType] as React.ReactElement, {
                                    color: colors.text,
                                })}
                                <Typography variant="body" bold style={styles.mealName}>
                                    {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                                </Typography>
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    setSelectedMealType(mealType);
                                    setShowAddModal(true);
                                }}
                            >
                                <Plus size={20} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {groupedEntries[mealType].length > 0 ? (
                            groupedEntries[mealType].map((entry) => (
                                <Card key={entry.id} style={styles.foodCard} padding="small">
                                    <View style={styles.foodRow}>
                                        <View style={styles.foodInfo}>
                                            <Typography variant="body">{entry.food_name}</Typography>
                                            {entry.serving_size && (
                                                <Typography variant="caption" color={colors.textSecondary}>
                                                    {entry.serving_size}
                                                </Typography>
                                            )}
                                        </View>
                                        <View style={styles.foodMacros}>
                                            <Typography variant="bodySmall">
                                                {entry.calories || 0} kcal
                                            </Typography>
                                            <TouchableOpacity
                                                onPress={() => deleteFoodEntry(entry.id)}
                                            >
                                                <Trash2 size={14} color={colors.error} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </Card>
                            ))
                        ) : (
                            <Typography
                                variant="bodySmall"
                                color={colors.textSecondary}
                                style={styles.emptyMeal}
                            >
                                No entries
                            </Typography>
                        )}
                    </View>
                ))}
            </ScrollView>

            {/* Add Food Modal */}
            {showAddModal && (
                <View style={[styles.modal, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Typography variant="h3">Add Food</Typography>
                        <TouchableOpacity onPress={() => setShowAddModal(false)}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalContent}>
                        <View style={styles.mealTypeSelector}>
                            {mealTypes.map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.mealTypeButton,
                                        {
                                            backgroundColor:
                                                selectedMealType === type ? colors.text : colors.surface,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                    onPress={() => setSelectedMealType(type)}
                                >
                                    <Typography
                                        variant="caption"
                                        color={selectedMealType === type ? colors.background : colors.text}
                                    >
                                        {type}
                                    </Typography>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                            placeholder="Food name"
                            placeholderTextColor={colors.textSecondary}
                            value={foodName}
                            onChangeText={setFoodName}
                        />
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                            placeholder="Calories"
                            placeholderTextColor={colors.textSecondary}
                            value={calories}
                            onChangeText={setCalories}
                            keyboardType="numeric"
                        />
                        <View style={styles.macroInputRow}>
                            <TextInput
                                style={[styles.macroInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                                placeholder="Protein (g)"
                                placeholderTextColor={colors.textSecondary}
                                value={protein}
                                onChangeText={setProtein}
                                keyboardType="numeric"
                            />
                            <TextInput
                                style={[styles.macroInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                                placeholder="Carbs (g)"
                                placeholderTextColor={colors.textSecondary}
                                value={carbs}
                                onChangeText={setCarbs}
                                keyboardType="numeric"
                            />
                            <TextInput
                                style={[styles.macroInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                                placeholder="Fat (g)"
                                placeholderTextColor={colors.textSecondary}
                                value={fat}
                                onChangeText={setFat}
                                keyboardType="numeric"
                            />
                        </View>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                            placeholder="Serving size (optional)"
                            placeholderTextColor={colors.textSecondary}
                            value={servingSize}
                            onChangeText={setServingSize}
                        />

                        <Button
                            title="Add Food"
                            onPress={addFoodEntry}
                            fullWidth
                            style={styles.addButton}
                        />
                    </ScrollView>
                </View>
            )}

            {/* FAB */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.text }]}
                onPress={() => setShowAddModal(true)}
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
    dateSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    summaryCard: {
        marginBottom: spacing.lg,
    },
    caloriesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: spacing.md,
    },
    caloriesRemaining: {
        alignItems: 'flex-end',
    },
    macroBar: {
        marginTop: spacing.sm,
    },
    macroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    macroTrack: {
        height: 8,
        borderRadius: 0,
    },
    macroFill: {
        height: '100%',
        borderRadius: 0,
    },
    mealSection: {
        marginBottom: spacing.lg,
    },
    mealHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    mealTitle: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mealName: {
        marginLeft: spacing.sm,
    },
    foodCard: {
        marginBottom: spacing.xs,
    },
    foodRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    foodInfo: {
        flex: 1,
    },
    foodMacros: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    emptyMeal: {
        paddingVertical: spacing.sm,
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
    modalContent: {
        padding: spacing.md,
    },
    mealTypeSelector: {
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    mealTypeButton: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderWidth: 1,
    },
    input: {
        borderWidth: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginBottom: spacing.md,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
    },
    macroInputRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    macroInput: {
        flex: 1,
        borderWidth: 1,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        marginBottom: spacing.md,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
    },
    addButton: {
        marginTop: spacing.md,
    },
    fab: {
        position: 'absolute',
        right: spacing.md,
        bottom: spacing.md,
        width: 56,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
});
