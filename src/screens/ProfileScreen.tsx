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
} from 'lucide-react-native';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ProfileScreen({ navigation }: any) {
    const { colors, isDark, toggleTheme } = useTheme();
    const { user, signOut } = useAuth();
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        if (!user) return;

        try {
            const { data } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (data) {
                setSettings(data);
            }
        } catch (error) {
            // Create default settings if not exists
            await supabase.from('user_settings').insert({
                user_id: user.id,
                units: 'metric',
                theme: 'dark',
                rest_days: [0, 6],
                calorie_goal: 2000,
                protein_goal: 150,
            });
            fetchSettings();
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
            await supabase
                .from('user_settings')
                .update({ [key]: value })
                .eq('user_id', user.id);

            setSettings((prev) => (prev ? { ...prev, [key]: value } : null));
        } catch (error) {
            console.error('Error updating setting:', error);
        }
    };

    const toggleRestDay = (day: number) => {
        if (!settings) return;
        const currentRestDays = settings.rest_days || [];
        const newRestDays = currentRestDays.includes(day)
            ? currentRestDays.filter((d) => d !== day)
            : [...currentRestDays, day];
        updateSetting('rest_days', newRestDays);
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
                        {daysOfWeek.map((day, index) => (
                            <TouchableOpacity
                                key={day}
                                style={[
                                    styles.dayButton,
                                    {
                                        backgroundColor: settings?.rest_days?.includes(index)
                                            ? colors.text
                                            : 'transparent',
                                        borderColor: colors.border,
                                    },
                                ]}
                                onPress={() => toggleRestDay(index)}
                            >
                                <Typography
                                    variant="caption"
                                    color={
                                        settings?.rest_days?.includes(index)
                                            ? colors.background
                                            : colors.text
                                    }
                                >
                                    {day}
                                </Typography>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Card>

                {/* Goals */}
                <Card style={styles.section}>
                    <View style={styles.settingHeader}>
                        <Target size={20} color={colors.text} />
                        <Typography variant="body" style={styles.settingLabel}>
                            Daily Goals
                        </Typography>
                    </View>
                    <View style={styles.goalRow}>
                        <Typography variant="bodySmall" color={colors.textSecondary}>
                            Calorie Goal
                        </Typography>
                        <Typography variant="body" bold>
                            {settings?.calorie_goal || 2000} kcal
                        </Typography>
                    </View>
                    <View style={styles.goalRow}>
                        <Typography variant="bodySmall" color={colors.textSecondary}>
                            Protein Goal
                        </Typography>
                        <Typography variant="body" bold>
                            {settings?.protein_goal || 150}g
                        </Typography>
                    </View>
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
