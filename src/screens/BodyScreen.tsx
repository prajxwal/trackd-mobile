import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useBody } from '../context/BodyContext';
import { Typography, Button, Card } from '../components/common';
import { spacing, fontFamily, fontSize } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { BodyMeasurement, GoalType, GoalIntensity, ActivityLevel, Sex, GOAL_LABELS, ACTIVITY_LABELS } from '../types';
import { formatDeficitSurplus } from '../utils/bodyCalculations';
import { format } from 'date-fns';
import { X, Scale, Ruler, Target, Flame, Info, ChevronRight, Edit3, Trash2 } from 'lucide-react-native';

const goalOptions: GoalType[] = ['maintenance', 'cut', 'bulk', 'recomp'];
const intensityOptions: GoalIntensity[] = ['mild', 'standard', 'aggressive'];
const activityOptions: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'high'];
const sexOptions: Sex[] = ['male', 'female'];

// Preset deficit percentages for quick selection
const deficitPresets = [10, 15, 20, 25];

export function BodyScreen({ navigation }: any) {
    const { colors } = useTheme();
    const { user } = useAuth();
    const { profile, nutritionTargets, isProfileComplete, updateProfile, refreshData } = useBody();

    const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modals
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showCalorieInfo, setShowCalorieInfo] = useState(false);

    const [profileForm, setProfileForm] = useState({
        weight_kg: '',
        body_fat_percent: '',
        height_cm: '',
        age: '',
        sex: 'male' as Sex,
        activity_level: 'moderate' as ActivityLevel,
        goal_type: 'maintenance' as GoalType,
        goal_intensity: 'standard' as GoalIntensity,
        custom_deficit_percent: '',
        custom_calorie_goal: '',
    });

    const [useCustomDeficit, setUseCustomDeficit] = useState(false);

    const fetchMeasurementHistory = async () => {
        if (!user) return;

        try {
            const { data } = await supabase
                .from('body_measurements')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(10);

            if (data) {
                setMeasurements(data);
            }
        } catch (error) {
            console.error('Error fetching measurements:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMeasurementHistory();
    }, [user]);

    useEffect(() => {
        // Sync profile form with loaded profile
        if (profile) {
            const deficitValue = profile.custom_deficit_percent?.toString() || '';
            // Check if the saved deficit is one of the presets or custom
            const isPreset = deficitValue && [10, 15, 20, 25].includes(profile.custom_deficit_percent || 0);

            setProfileForm({
                weight_kg: profile.weight_kg?.toString() || '',
                body_fat_percent: profile.body_fat_percent?.toString() || '',
                height_cm: profile.height_cm?.toString() || '',
                age: profile.age?.toString() || '',
                sex: profile.sex || 'male',
                activity_level: profile.activity_level || 'moderate',
                goal_type: profile.goal_type || 'maintenance',
                goal_intensity: profile.goal_intensity || 'standard',
                custom_deficit_percent: deficitValue,
                custom_calorie_goal: profile.custom_calorie_goal?.toString() || '',
            });
            // Only set useCustomDeficit if there's a value AND it's not a preset
            setUseCustomDeficit(!!deficitValue && !isPreset);
        }
    }, [profile]);

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchMeasurementHistory(), refreshData()]);
    };

    const saveProfile = async () => {
        if (!profileForm.weight_kg || !profileForm.height_cm || !profileForm.age) {
            Alert.alert('Error', 'Please enter weight, height, and age');
            return;
        }

        // Validate deficit cannot exceed body fat %
        if (profileForm.goal_type === 'cut' && profileForm.body_fat_percent && profileForm.custom_deficit_percent) {
            const deficitPercent = parseInt(profileForm.custom_deficit_percent);
            const bodyFat = parseFloat(profileForm.body_fat_percent);
            if (deficitPercent > bodyFat) {
                Alert.alert('Warning', `Your deficit (${deficitPercent}%) is higher than your body fat (${bodyFat}%). Consider a smaller deficit.`);
            }
        }

        const newWeight = parseFloat(profileForm.weight_kg);
        const newBodyFat = profileForm.body_fat_percent ? parseFloat(profileForm.body_fat_percent) : null;
        const oldWeight = profile?.weight_kg;
        const oldBodyFat = profile?.body_fat_percent;

        const updates: any = {
            weight_kg: newWeight,
            height_cm: parseFloat(profileForm.height_cm),
            age: parseInt(profileForm.age),
            sex: profileForm.sex,
            activity_level: profileForm.activity_level,
            goal_type: profileForm.goal_type,
            goal_intensity: profileForm.goal_intensity,
        };

        // Add optional fields
        if (newBodyFat !== null) {
            updates.body_fat_percent = newBodyFat;
        }

        // Custom deficit for fat loss goal
        if (profileForm.goal_type === 'cut' && profileForm.custom_deficit_percent) {
            updates.custom_deficit_percent = parseInt(profileForm.custom_deficit_percent);
        } else {
            updates.custom_deficit_percent = null;
        }

        // Custom calorie goal override
        if (profileForm.custom_calorie_goal) {
            updates.custom_calorie_goal = parseInt(profileForm.custom_calorie_goal);
        } else {
            updates.custom_calorie_goal = null; // Clear override, use calculated
        }

        const success = await updateProfile(updates);

        if (success) {
            // Only log to measurement history if weight or body fat changed
            const weightChanged = oldWeight !== newWeight;
            const bodyFatChanged = oldBodyFat !== newBodyFat;

            if (weightChanged || bodyFatChanged) {
                await supabase.from('body_measurements').insert({
                    user_id: user?.id,
                    date: format(new Date(), 'yyyy-MM-dd'),
                    weight: newWeight,
                    body_fat: newBodyFat,
                });
                fetchMeasurementHistory();
            }

            setShowProfileModal(false);
        } else {
            Alert.alert('Error', 'Failed to save profile');
        }
    };

    const deleteMeasurement = async (id: string) => {
        Alert.alert(
            'Delete Measurement',
            'Are you sure you want to delete this entry?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await supabase.from('body_measurements').delete().eq('id', id);
                            fetchMeasurementHistory();
                        } catch (error) {
                            console.error('Error deleting measurement:', error);
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
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
                {/* Goal & Calorie Card */}
                {isProfileComplete && nutritionTargets ? (
                    <>
                        {/* Current Stats */}
                        <View style={styles.statsRow}>
                            <Card style={styles.statCard}>
                                <Scale size={24} color={colors.text} />
                                <Typography variant="h1" bold style={styles.statValue}>
                                    {profile?.weight_kg || '--'}
                                </Typography>
                                <Typography variant="caption" color={colors.textSecondary}>
                                    kg
                                </Typography>
                            </Card>

                            <Card style={styles.statCard}>
                                <Ruler size={24} color={colors.text} />
                                <Typography variant="h1" bold style={styles.statValue}>
                                    {profile?.body_fat_percent || '--'}
                                </Typography>
                                <Typography variant="caption" color={colors.textSecondary}>
                                    % body fat
                                </Typography>
                            </Card>
                        </View>

                        <Card style={styles.calorieCard}>
                            <View style={styles.goalBadge}>
                                <Target size={16} color={colors.text} />
                                <Typography variant="bodySmall" bold style={styles.goalText}>
                                    {formatDeficitSurplus(
                                        profile?.goal_type || 'maintenance',
                                        nutritionTargets.deficitOrSurplus,
                                        nutritionTargets.deficitPercent
                                    )}
                                </Typography>
                            </View>

                            <View style={styles.calorieRow}>
                                <View style={styles.calorieItem}>
                                    <Typography variant="caption" color={colors.textSecondary}>
                                        Maintenance
                                    </Typography>
                                    <Typography variant="h3" bold>
                                        {nutritionTargets.tdee}
                                    </Typography>
                                    <Typography variant="caption" color={colors.textSecondary}>
                                        kcal
                                    </Typography>
                                </View>
                                <View style={[styles.calorieDivider, { backgroundColor: colors.border }]} />
                                <View style={styles.calorieItem}>
                                    <Typography variant="caption" color={colors.textSecondary}>
                                        Target
                                    </Typography>
                                    <Typography variant="h3" bold>
                                        {nutritionTargets.targetCalories}
                                    </Typography>
                                    <Typography variant="caption" color={colors.textSecondary}>
                                        kcal
                                    </Typography>
                                </View>
                            </View>

                            {/* Macros Row */}
                            <View style={[styles.macrosRow, { borderTopColor: colors.border }]}>
                                <View style={styles.macroItem}>
                                    <Typography variant="caption" color={colors.textSecondary}>Protein</Typography>
                                    <Typography variant="body" bold>{nutritionTargets.proteinGrams}g</Typography>
                                </View>
                                <View style={styles.macroItem}>
                                    <Typography variant="caption" color={colors.textSecondary}>Fat</Typography>
                                    <Typography variant="body" bold>{nutritionTargets.fatGrams}g</Typography>
                                </View>
                                <View style={styles.macroItem}>
                                    <Typography variant="caption" color={colors.textSecondary}>Carbs</Typography>
                                    <Typography variant="body" bold>{nutritionTargets.carbGrams}g</Typography>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.infoButton}
                                onPress={() => setShowCalorieInfo(true)}
                            >
                                <Info size={14} color={colors.textSecondary} />
                                <Typography variant="caption" color={colors.textSecondary} style={{ marginLeft: 4 }}>
                                    How is this calculated?
                                </Typography>
                            </TouchableOpacity>
                        </Card>

                        {/* Update Profile Button */}
                        <Button
                            title="Update Profile"
                            variant="outline"
                            onPress={() => setShowProfileModal(true)}
                            fullWidth
                            style={styles.updateButton}
                            icon={<Edit3 size={16} color={colors.text} style={{ marginRight: spacing.xs }} />}
                        />

                        {/* Measurement History */}
                        {measurements.length > 0 && (
                            <>
                                <Typography variant="body" bold style={styles.historyTitle}>
                                    Weight History
                                </Typography>
                                {measurements.map((measurement) => (
                                    <Card key={measurement.id} style={styles.historyCard} padding="small">
                                        <View style={styles.historyRow}>
                                            <Typography variant="bodySmall">
                                                {format(new Date(measurement.date), 'MMM d, yyyy')}
                                            </Typography>
                                            <View style={styles.historyValues}>
                                                {measurement.weight && (
                                                    <Typography variant="bodySmall">
                                                        {measurement.weight} kg
                                                    </Typography>
                                                )}
                                                {measurement.body_fat && (
                                                    <Typography variant="bodySmall" color={colors.textSecondary}>
                                                        {measurement.body_fat}%
                                                    </Typography>
                                                )}
                                                <TouchableOpacity onPress={() => deleteMeasurement(measurement.id)}>
                                                    <Trash2 size={14} color={colors.error || '#ff4444'} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </Card>
                                ))}
                            </>
                        )}
                    </>
                ) : (
                    <Card style={styles.setupCard}>
                        <Flame size={32} color={colors.text} />
                        <Typography variant="body" bold style={{ marginTop: spacing.sm }}>
                            Set up your profile
                        </Typography>
                        <Typography variant="caption" color={colors.textSecondary} center style={{ marginTop: spacing.xs }}>
                            Enter your details to get personalized calorie and macro targets
                        </Typography>
                        <Button
                            title="Set Up Profile"
                            onPress={() => setShowProfileModal(true)}
                            style={{ marginTop: spacing.md }}
                        />
                    </Card>
                )}
            </ScrollView>

            {/* Profile Setup Modal */}
            <Modal
                visible={showProfileModal}
                animationType="slide"
                presentationStyle="fullScreen"
            >
                <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Typography variant="h3">Body Profile</Typography>
                        <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalContent}>
                        {/* Body Stats Section */}
                        <Typography variant="body" bold style={{ marginBottom: spacing.sm }}>
                            Body Stats
                        </Typography>

                        <Typography variant="bodySmall" color={colors.textSecondary}>
                            Weight (kg) *
                        </Typography>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                            placeholder="e.g. 75"
                            placeholderTextColor={colors.textSecondary}
                            value={profileForm.weight_kg}
                            onChangeText={(v) => setProfileForm({ ...profileForm, weight_kg: v })}
                            keyboardType="numeric"
                        />

                        <Typography variant="bodySmall" color={colors.textSecondary}>
                            Body Fat % (optional)
                        </Typography>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                            placeholder="e.g. 15"
                            placeholderTextColor={colors.textSecondary}
                            value={profileForm.body_fat_percent}
                            onChangeText={(v) => setProfileForm({ ...profileForm, body_fat_percent: v })}
                            keyboardType="numeric"
                        />

                        <Typography variant="bodySmall" color={colors.textSecondary}>
                            Height (cm) *
                        </Typography>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                            placeholder="e.g. 175"
                            placeholderTextColor={colors.textSecondary}
                            value={profileForm.height_cm}
                            onChangeText={(v) => setProfileForm({ ...profileForm, height_cm: v })}
                            keyboardType="numeric"
                        />

                        <Typography variant="bodySmall" color={colors.textSecondary}>
                            Age *
                        </Typography>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                            placeholder="e.g. 25"
                            placeholderTextColor={colors.textSecondary}
                            value={profileForm.age}
                            onChangeText={(v) => setProfileForm({ ...profileForm, age: v })}
                            keyboardType="numeric"
                        />

                        <Typography variant="bodySmall" color={colors.textSecondary}>
                            Sex *
                        </Typography>
                        <View style={styles.optionRow}>
                            {sexOptions.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.optionButton,
                                        { borderColor: colors.border },
                                        profileForm.sex === option && { backgroundColor: colors.text }
                                    ]}
                                    onPress={() => setProfileForm({ ...profileForm, sex: option })}
                                >
                                    <Typography
                                        variant="bodySmall"
                                        color={profileForm.sex === option ? colors.background : colors.text}
                                    >
                                        {option.charAt(0).toUpperCase() + option.slice(1)}
                                    </Typography>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Activity & Goals Section */}
                        <Typography variant="body" bold style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
                            Activity & Goals
                        </Typography>

                        <Typography variant="bodySmall" color={colors.textSecondary}>
                            Activity Level
                        </Typography>
                        {activityOptions.map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={[
                                    styles.listOption,
                                    { borderColor: colors.border },
                                    profileForm.activity_level === option && { backgroundColor: colors.surface }
                                ]}
                                onPress={() => setProfileForm({ ...profileForm, activity_level: option })}
                            >
                                <Typography variant="bodySmall">
                                    {ACTIVITY_LABELS[option]}
                                </Typography>
                            </TouchableOpacity>
                        ))}

                        <Typography variant="bodySmall" color={colors.textSecondary} style={{ marginTop: spacing.md }}>
                            Goal
                        </Typography>
                        <View style={styles.optionRow}>
                            {goalOptions.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.optionButton,
                                        { borderColor: colors.border },
                                        profileForm.goal_type === option && { backgroundColor: colors.text }
                                    ]}
                                    onPress={() => setProfileForm({ ...profileForm, goal_type: option })}
                                >
                                    <Typography
                                        variant="caption"
                                        color={profileForm.goal_type === option ? colors.background : colors.text}
                                    >
                                        {GOAL_LABELS[option]}
                                    </Typography>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Show intensity/deficit options for cut/bulk */}
                        {profileForm.goal_type === 'cut' && (
                            <>
                                <Typography variant="bodySmall" color={colors.textSecondary} style={{ marginTop: spacing.md }}>
                                    Deficit Amount
                                </Typography>

                                {/* Preset options */}
                                <View style={styles.optionRow}>
                                    {deficitPresets.map((percent) => {
                                        const isSelected = !useCustomDeficit &&
                                            profileForm.custom_deficit_percent === percent.toString();
                                        return (
                                            <TouchableOpacity
                                                key={percent}
                                                style={[
                                                    styles.optionButton,
                                                    { borderColor: colors.border },
                                                    isSelected && { backgroundColor: colors.text }
                                                ]}
                                                onPress={() => {
                                                    setUseCustomDeficit(false);
                                                    setProfileForm({
                                                        ...profileForm,
                                                        custom_deficit_percent: percent.toString(),
                                                        goal_intensity: 'standard'
                                                    });
                                                }}
                                            >
                                                <Typography
                                                    variant="bodySmall"
                                                    color={isSelected ? colors.background : colors.text}
                                                >
                                                    −{percent}%
                                                </Typography>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {/* Custom deficit input */}
                                <TouchableOpacity
                                    style={[
                                        styles.listOption,
                                        { borderColor: colors.border, marginTop: spacing.sm },
                                        useCustomDeficit && { backgroundColor: colors.surface }
                                    ]}
                                    onPress={() => setUseCustomDeficit(true)}
                                >
                                    <Typography variant="bodySmall">Custom deficit %</Typography>
                                </TouchableOpacity>

                                {useCustomDeficit && (
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                                        placeholder="e.g. 15"
                                        placeholderTextColor={colors.textSecondary}
                                        value={profileForm.custom_deficit_percent}
                                        onChangeText={(v) => setProfileForm({ ...profileForm, custom_deficit_percent: v })}
                                        keyboardType="numeric"
                                    />
                                )}
                            </>
                        )}

                        {profileForm.goal_type === 'bulk' && (
                            <>
                                <Typography variant="bodySmall" color={colors.textSecondary} style={{ marginTop: spacing.md }}>
                                    Surplus Amount
                                </Typography>
                                <View style={styles.optionRow}>
                                    {[
                                        { label: '+200', intensity: 'lean' as GoalIntensity },
                                        { label: '+300', intensity: 'standard' as GoalIntensity },
                                        { label: '+400', intensity: 'aggressive' as GoalIntensity },
                                    ].map((option) => (
                                        <TouchableOpacity
                                            key={option.intensity}
                                            style={[
                                                styles.optionButton,
                                                { borderColor: colors.border },
                                                profileForm.goal_intensity === option.intensity && { backgroundColor: colors.text }
                                            ]}
                                            onPress={() => setProfileForm({ ...profileForm, goal_intensity: option.intensity })}
                                        >
                                            <Typography
                                                variant="bodySmall"
                                                color={profileForm.goal_intensity === option.intensity ? colors.background : colors.text}
                                            >
                                                {option.label} kcal
                                            </Typography>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}

                        {/* Custom Calorie Override Section */}
                        <View style={{ marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }}>
                            <Typography variant="bodySmall" color={colors.textSecondary}>
                                Custom Calorie Goal (optional)
                            </Typography>
                            <Typography variant="caption" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
                                Leave empty to use calculated value. Set a custom goal if you want a different target.
                            </Typography>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                                placeholder={nutritionTargets ? `Calculated: ${nutritionTargets.targetCalories} kcal` : 'e.g. 2000'}
                                placeholderTextColor={colors.textSecondary}
                                value={profileForm.custom_calorie_goal || ''}
                                onChangeText={(v) => setProfileForm({ ...profileForm, custom_calorie_goal: v })}
                                keyboardType="numeric"
                            />
                        </View>

                        <Button
                            title="Save Profile"
                            onPress={saveProfile}
                            fullWidth
                            style={styles.saveButton}
                        />
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* Calorie Info Modal */}
            <Modal
                visible={showCalorieInfo && !!nutritionTargets && !!profile}
                animationType="slide"
                presentationStyle="fullScreen"
            >
                <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Typography variant="h3">How It's Calculated</Typography>
                        <TouchableOpacity onPress={() => setShowCalorieInfo(false)}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    {profile && nutritionTargets && (
                        <ScrollView style={styles.modalContent}>
                            <Card style={styles.infoCard}>
                                <Typography variant="body" bold>Step 1: BMR</Typography>
                                <Typography variant="caption" color={colors.textSecondary}>
                                    Basal Metabolic Rate (Mifflin-St Jeor)
                                </Typography>
                                <Typography variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.xs }}>
                                    Based on: {profile.weight_kg}kg, {profile.height_cm}cm, {profile.age}y, {profile.sex}
                                </Typography>
                                <Typography variant="h3" bold style={{ marginTop: spacing.xs }}>
                                    {nutritionTargets.bmr} kcal
                                </Typography>
                            </Card>

                            <Card style={styles.infoCard}>
                                <Typography variant="body" bold>Step 2: TDEE</Typography>
                                <Typography variant="caption" color={colors.textSecondary}>
                                    BMR × {profile.activity_level} activity multiplier
                                </Typography>
                                <Typography variant="h3" bold style={{ marginTop: spacing.xs }}>
                                    {nutritionTargets.tdee} kcal
                                </Typography>
                            </Card>

                            <Card style={styles.infoCard}>
                                <Typography variant="body" bold>Step 3: Target</Typography>
                                <Typography variant="caption" color={colors.textSecondary}>
                                    {formatDeficitSurplus(
                                        profile.goal_type || 'maintenance',
                                        nutritionTargets.deficitOrSurplus,
                                        nutritionTargets.deficitPercent
                                    )}
                                </Typography>
                                <Typography variant="h3" bold style={{ marginTop: spacing.xs }}>
                                    {nutritionTargets.targetCalories} kcal
                                </Typography>
                                <Typography variant="caption" color={colors.textSecondary}>
                                    ({nutritionTargets.deficitOrSurplus > 0 ? '+' : ''}{nutritionTargets.deficitOrSurplus} from TDEE)
                                </Typography>
                            </Card>

                            <Card style={styles.infoCard}>
                                <Typography variant="body" bold>Macros</Typography>
                                <View style={{ marginTop: spacing.xs }}>
                                    <Typography variant="caption" color={colors.textSecondary}>
                                        Protein: {nutritionTargets.proteinGrams}g × 4 = {nutritionTargets.proteinGrams * 4} kcal
                                    </Typography>
                                    <Typography variant="caption" color={colors.textSecondary}>
                                        Fat: {nutritionTargets.fatGrams}g × 9 = {nutritionTargets.fatGrams * 9} kcal
                                    </Typography>
                                    <Typography variant="caption" color={colors.textSecondary}>
                                        Carbs: {nutritionTargets.carbGrams}g × 4 = {nutritionTargets.carbGrams * 4} kcal
                                    </Typography>
                                </View>
                            </Card>
                        </ScrollView>
                    )}
                </SafeAreaView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.lg,
    },
    statValue: {
        marginTop: spacing.sm,
    },
    calorieCard: {
        marginTop: spacing.md,
    },
    goalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    goalText: {
        marginLeft: spacing.xs,
        flex: 1,
    },
    calorieRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    calorieItem: {
        flex: 1,
        alignItems: 'center',
    },
    calorieDivider: {
        width: 1,
        height: 40,
    },
    macrosRow: {
        flexDirection: 'row',
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
    },
    macroItem: {
        flex: 1,
        alignItems: 'center',
    },
    infoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.md,
    },
    updateButton: {
        marginTop: spacing.md,
    },
    setupCard: {
        alignItems: 'center',
        paddingVertical: spacing.lg,
    },
    historyTitle: {
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    historyCard: {
        marginBottom: spacing.xs,
    },
    historyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    historyValues: {
        flexDirection: 'row',
        gap: spacing.md,
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
    input: {
        borderWidth: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginTop: spacing.xs,
        marginBottom: spacing.md,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
    },
    saveButton: {
        marginTop: spacing.lg,
        marginBottom: spacing.xxl,
    },
    optionRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        marginTop: spacing.xs,
    },
    optionButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: 1,
        borderRadius: 4,
    },
    listOption: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: 1,
        borderRadius: 4,
        marginTop: spacing.xs,
    },
    infoCard: {
        marginBottom: spacing.md,
    },
});
