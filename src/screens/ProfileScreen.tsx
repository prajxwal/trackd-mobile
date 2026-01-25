import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useBody } from '../context/BodyContext';
import { Typography, Card, Button } from '../components/common';
import { spacing } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { UserSettings } from '../types';
import {
    User,
    Moon,
    Sun,
    Scale,
    Calendar,
    Dumbbell,
    LogOut,
    ChevronRight,
    Target,
    Edit3,
} from 'lucide-react-native';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ProfileScreen({ navigation }: any) {
    const { colors, isDark, toggleTheme } = useTheme();
    const { user, signOut } = useAuth();
    const { nutritionTargets, isProfileComplete, profile } = useBody();
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code === 'PGRST116') {
                // No row found - create default settings
                console.log('Creating default settings...');
                const defaultSettings = {
                    user_id: user.id,
                    units: 'metric',
                    theme: 'dark',
                    rest_days: [0, 6],
                    // Don't set calorie_goal/protein_goal by default - use Body Profile calculated values
                };

                const { data: newData, error: insertError } = await supabase
                    .from('user_settings')
                    .insert(defaultSettings)
                    .select()
                    .single();

                if (insertError) {
                    console.error('Error creating settings:', insertError);
                } else if (newData) {
                    setSettings(newData);
                }
            } else if (error) {
                console.error('Error fetching settings:', error);
            } else if (data) {
                setSettings(data);
            }
        } catch (error) {
            console.error('Error in fetchSettings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, [user]);

    const updateSetting = async (key: string, value: any) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('user_settings')
                .update({ [key]: value })
                .eq('user_id', user.id);

            if (error) {
                console.error('Error updating setting:', error);
                return;
            }

            setSettings((prev) => (prev ? { ...prev, [key]: value } : null));
        } catch (error) {
            console.error('Error updating setting:', error);
        }
    };

    const toggleRestDay = async (day: number) => {
        if (!user) return;

        // Use default rest days if settings or rest_days is null
        const currentRestDays = settings?.rest_days || [0, 6];
        const newRestDays = currentRestDays.includes(day)
            ? currentRestDays.filter((d) => d !== day)
            : [...currentRestDays, day].sort((a, b) => a - b);

        // Update local state immediately for responsiveness
        if (settings) {
            setSettings({ ...settings, rest_days: newRestDays });
        } else {
            // Create settings object if it doesn't exist
            const newSettings: UserSettings = {
                user_id: user.id,
                units: 'metric',
                theme: 'dark',
                rest_days: newRestDays,
                // Don't set calorie/protein goals - use Body Profile calculated values
            };
            setSettings(newSettings);
        }

        // Save to database with upsert
        try {
            const { error } = await supabase
                .from('user_settings')
                .upsert({
                    user_id: user.id,
                    rest_days: newRestDays,
                    units: settings?.units || 'metric',
                    theme: settings?.theme || 'dark',
                    // Preserve existing calorie/protein goals if set
                    ...(settings?.calorie_goal ? { calorie_goal: settings.calorie_goal } : {}),
                    ...(settings?.protein_goal ? { protein_goal: settings.protein_goal } : {}),
                });

            if (error) {
                console.error('Error saving rest days:', error);
            }
        } catch (error) {
            console.error('Error saving rest days:', error);
        }
    };

    const handleSignOut = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: signOut },
        ]);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                {/* Profile Header */}
                <View style={styles.header}>
                    <View style={[styles.avatar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <User size={32} color={colors.text} />
                    </View>
                    <Typography variant="body" style={styles.email}>
                        {user?.email}
                    </Typography>
                </View>

                {/* Theme */}
                <Card style={styles.section}>
                    <TouchableOpacity style={styles.settingRow} onPress={toggleTheme}>
                        <View style={styles.settingLeft}>
                            {isDark ? (
                                <Moon size={20} color={colors.text} />
                            ) : (
                                <Sun size={20} color={colors.text} />
                            )}
                            <Typography variant="body" style={styles.settingLabel}>
                                Dark Mode
                            </Typography>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: colors.border, true: colors.text }}
                            thumbColor={colors.background}
                        />
                    </TouchableOpacity>
                </Card>

                {/* Units */}
                <Card style={styles.section}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Scale size={20} color={colors.text} />
                            <Typography variant="body" style={styles.settingLabel}>
                                Units
                            </Typography>
                        </View>
                        <View style={styles.unitSelector}>
                            {['metric', 'imperial'].map((unit) => (
                                <TouchableOpacity
                                    key={unit}
                                    style={[
                                        styles.unitButton,
                                        {
                                            backgroundColor:
                                                settings?.units === unit ? colors.text : 'transparent',
                                            borderColor: colors.border,
                                        },
                                    ]}
                                    onPress={() => updateSetting('units', unit)}
                                >
                                    <Typography
                                        variant="caption"
                                        color={settings?.units === unit ? colors.background : colors.text}
                                    >
                                        {unit === 'metric' ? 'kg/cm' : 'lbs/in'}
                                    </Typography>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </Card>

                {/* Rest Days */}
                <Card style={styles.section}>
                    <View style={styles.settingHeader}>
                        <Calendar size={20} color={colors.text} />
                        <Typography variant="body" style={styles.settingLabel}>
                            Rest Days
                        </Typography>
                    </View>
                    <Typography variant="caption" color={colors.textSecondary} style={styles.settingHint}>
                        Rest days won't break your streak
                    </Typography>
                    <View style={styles.daysRow}>
                        {daysOfWeek.map((day, index) => {
                            const isSelected = settings?.rest_days?.includes(index) ?? (index === 0 || index === 6);
                            return (
                                <TouchableOpacity
                                    key={day}
                                    style={[
                                        styles.dayButton,
                                        {
                                            backgroundColor: isSelected ? colors.text : 'transparent',
                                            borderColor: isSelected ? colors.text : colors.border,
                                            borderWidth: isSelected ? 2 : 1,
                                        },
                                    ]}
                                    onPress={() => toggleRestDay(index)}
                                >
                                    <Typography
                                        variant="caption"
                                        bold={isSelected}
                                        color={isSelected ? colors.background : colors.text}
                                    >
                                        {day}
                                    </Typography>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    <Typography variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
                        Selected: {(settings?.rest_days ?? [0, 6]).map(d => daysOfWeek[d]).join(', ') || 'None'}
                    </Typography>
                </Card>

                {/* Goals */}
                <Card style={styles.section}>
                    <View style={[styles.settingRow, { marginBottom: spacing.sm }]}>
                        <View style={styles.settingLeft}>
                            <Target size={20} color={colors.text} />
                            <Typography variant="body" style={styles.settingLabel}>
                                Daily Goals
                            </Typography>
                        </View>
                        <TouchableOpacity onPress={() => navigation.navigate('Body')}>
                            <Typography variant="caption" color={colors.textSecondary}>
                                Edit →
                            </Typography>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.goalRow}>
                        <Typography variant="bodySmall" color={colors.textSecondary}>
                            Calorie Goal
                        </Typography>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Typography variant="body" bold>
                                {profile?.custom_calorie_goal || nutritionTargets?.targetCalories || 2000} kcal
                            </Typography>
                            {!profile?.custom_calorie_goal && nutritionTargets?.targetCalories && (
                                <Typography variant="caption" color={colors.textSecondary} style={{ marginLeft: spacing.xs }}>
                                    (calc)
                                </Typography>
                            )}
                            {profile?.custom_calorie_goal && (
                                <Typography variant="caption" color={colors.textSecondary} style={{ marginLeft: spacing.xs }}>
                                    (custom)
                                </Typography>
                            )}
                        </View>
                    </View>
                    <View style={styles.goalRow}>
                        <Typography variant="bodySmall" color={colors.textSecondary}>
                            Protein Goal
                        </Typography>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Typography variant="body" bold>
                                {nutritionTargets?.proteinGrams || 150}g
                            </Typography>
                            {nutritionTargets?.proteinGrams && (
                                <Typography variant="caption" color={colors.textSecondary} style={{ marginLeft: spacing.xs }}>
                                    (calc)
                                </Typography>
                            )}
                        </View>
                    </View>
                    {!isProfileComplete && (
                        <TouchableOpacity
                            style={{ marginTop: spacing.sm }}
                            onPress={() => navigation.navigate('Body')}
                        >
                            <Typography variant="caption" color={colors.textSecondary}>
                                Set up Body Profile for personalized goals →
                            </Typography>
                        </TouchableOpacity>
                    )}
                </Card>

                {/* Exercise Library */}
                <Card style={styles.section}>
                    <TouchableOpacity
                        style={styles.linkRow}
                        onPress={() => navigation.navigate('ExerciseLibrary')}
                    >
                        <View style={styles.settingLeft}>
                            <Dumbbell size={20} color={colors.text} />
                            <Typography variant="body" style={styles.settingLabel}>
                                Exercise Library
                            </Typography>
                        </View>
                        <ChevronRight size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </Card>

                {/* Sign Out */}
                <Button
                    title="Sign Out"
                    variant="outline"
                    onPress={handleSignOut}
                    icon={<LogOut size={16} color={colors.text} style={{ marginRight: spacing.xs }} />}
                    fullWidth
                    style={styles.signOutButton}
                />
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
        alignItems: 'center',
        marginBottom: spacing.xl,
        paddingTop: spacing.lg,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 0,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    email: {
        marginTop: spacing.md,
    },
    section: {
        marginBottom: spacing.md,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    settingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingLabel: {
        marginLeft: spacing.sm,
    },
    settingHint: {
        marginBottom: spacing.sm,
    },
    unitSelector: {
        flexDirection: 'row',
    },
    unitButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderWidth: 1,
    },
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
    },
    dayButton: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderWidth: 1,
    },
    goalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.xs,
    },
    linkRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    signOutButton: {
        marginTop: spacing.lg,
    },
});
