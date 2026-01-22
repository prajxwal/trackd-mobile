import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Typography, Button, Card } from '../components/common';
import { spacing, fontFamily, fontSize } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { BodyMeasurement } from '../types';
import { format } from 'date-fns';
import { Plus, X, Scale, Ruler, TrendingUp, TrendingDown } from 'lucide-react-native';

const measurementFields = [
    { key: 'chest', label: 'Chest' },
    { key: 'waist', label: 'Waist' },
    { key: 'hips', label: 'Hips' },
    { key: 'left_arm', label: 'Left Arm' },
    { key: 'right_arm', label: 'Right Arm' },
    { key: 'left_thigh', label: 'Left Thigh' },
    { key: 'right_thigh', label: 'Right Thigh' },
];

export function BodyScreen({ navigation }: any) {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form state
    const [weight, setWeight] = useState('');
    const [bodyFat, setBodyFat] = useState('');
    const [customMeasurements, setCustomMeasurements] = useState<Record<string, string>>({});

    const fetchData = async () => {
        if (!user) return;

        try {
            const { data } = await supabase
                .from('body_measurements')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });

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
        fetchData();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const addMeasurement = async () => {
        if (!weight && !bodyFat && Object.keys(customMeasurements).length === 0) {
            Alert.alert('Error', 'Please enter at least one measurement');
            return;
        }

        try {
            const measurementsObj: Record<string, number> = {};
            Object.entries(customMeasurements).forEach(([key, value]) => {
                if (value) measurementsObj[key] = parseFloat(value);
            });

            await supabase.from('body_measurements').insert({
                user_id: user?.id,
                date: format(new Date(), 'yyyy-MM-dd'),
                weight: weight ? parseFloat(weight) : null,
                body_fat: bodyFat ? parseFloat(bodyFat) : null,
                measurements: Object.keys(measurementsObj).length > 0 ? measurementsObj : null,
            });

            setWeight('');
            setBodyFat('');
            setCustomMeasurements({});
            setShowAddModal(false);
            fetchData();
        } catch (error) {
            console.error('Error adding measurement:', error);
            Alert.alert('Error', 'Failed to add measurement');
        }
    };

    const latestMeasurement = measurements[0];
    const previousMeasurement = measurements[1];

    const getWeightChange = () => {
        if (!latestMeasurement?.weight || !previousMeasurement?.weight) return null;
        return latestMeasurement.weight - previousMeasurement.weight;
    };

    const weightChange = getWeightChange();

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
                {/* Current Stats */}
                <View style={styles.statsRow}>
                    <Card style={styles.statCard}>
                        <Scale size={24} color={colors.text} />
                        <Typography variant="h1" bold style={styles.statValue}>
                            {latestMeasurement?.weight || '--'}
                        </Typography>
                        <Typography variant="caption" color={colors.textSecondary}>
                            kg
                        </Typography>
                        {weightChange !== null && (
                            <View style={styles.changeRow}>
                                {weightChange > 0 ? (
                                    <TrendingUp size={14} color={colors.text} />
                                ) : (
                                    <TrendingDown size={14} color={colors.text} />
                                )}
                                <Typography variant="caption" style={styles.changeText}>
                                    {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}
                                </Typography>
                            </View>
                        )}
                    </Card>

                    <Card style={styles.statCard}>
                        <Ruler size={24} color={colors.text} />
                        <Typography variant="h1" bold style={styles.statValue}>
                            {latestMeasurement?.body_fat || '--'}
                        </Typography>
                        <Typography variant="caption" color={colors.textSecondary}>
                            % body fat
                        </Typography>
                    </Card>
                </View>

                {/* Latest Measurements */}
                {latestMeasurement?.measurements && (
                    <Card style={styles.measurementsCard}>
                        <Typography variant="body" bold style={styles.sectionTitle}>
                            Measurements
                        </Typography>
                        <Typography variant="caption" color={colors.textSecondary}>
                            {format(new Date(latestMeasurement.date), 'MMM d, yyyy')}
                        </Typography>
                        <View style={styles.measurementsList}>
                            {measurementFields.map((field) => {
                                const value = latestMeasurement.measurements?.[field.key];
                                if (!value) return null;
                                return (
                                    <View key={field.key} style={styles.measurementItem}>
                                        <Typography variant="bodySmall" color={colors.textSecondary}>
                                            {field.label}
                                        </Typography>
                                        <Typography variant="body" bold>
                                            {value} cm
                                        </Typography>
                                    </View>
                                );
                            })}
                        </View>
                    </Card>
                )}

                {/* History */}
                <Typography variant="body" bold style={styles.historyTitle}>
                    History
                </Typography>
                {measurements.slice(0, 10).map((measurement) => (
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
                            </View>
                        </View>
                    </Card>
                ))}

                {measurements.length === 0 && (
                    <View style={styles.empty}>
                        <Typography variant="body" color={colors.textSecondary} center>
                            No measurements yet
                        </Typography>
                    </View>
                )}
            </ScrollView>

            {/* Add Modal */}
            {showAddModal && (
                <View style={[styles.modal, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Typography variant="h3">Add Measurement</Typography>
                        <TouchableOpacity onPress={() => setShowAddModal(false)}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalContent}>
                        <Typography variant="bodySmall" color={colors.textSecondary}>
                            Weight (kg)
                        </Typography>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                            placeholder="e.g. 75"
                            placeholderTextColor={colors.textSecondary}
                            value={weight}
                            onChangeText={setWeight}
                            keyboardType="numeric"
                        />

                        <Typography variant="bodySmall" color={colors.textSecondary}>
                            Body Fat %
                        </Typography>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                            placeholder="e.g. 15"
                            placeholderTextColor={colors.textSecondary}
                            value={bodyFat}
                            onChangeText={setBodyFat}
                            keyboardType="numeric"
                        />

                        <Typography variant="body" bold style={styles.measurementsTitle}>
                            Body Measurements (cm)
                        </Typography>
                        {measurementFields.map((field) => (
                            <View key={field.key}>
                                <Typography variant="bodySmall" color={colors.textSecondary}>
                                    {field.label}
                                </Typography>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                                    placeholder="cm"
                                    placeholderTextColor={colors.textSecondary}
                                    value={customMeasurements[field.key] || ''}
                                    onChangeText={(v) =>
                                        setCustomMeasurements({ ...customMeasurements, [field.key]: v })
                                    }
                                    keyboardType="numeric"
                                />
                            </View>
                        ))}

                        <Button
                            title="Save Measurement"
                            onPress={addMeasurement}
                            fullWidth
                            style={styles.saveButton}
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
    changeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    changeText: {
        marginLeft: spacing.xs,
    },
    measurementsCard: {
        marginTop: spacing.md,
    },
    sectionTitle: {
        marginBottom: spacing.xs,
    },
    measurementsList: {
        marginTop: spacing.md,
    },
    measurementItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.xs,
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
    empty: {
        padding: spacing.xxl,
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
    measurementsTitle: {
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    saveButton: {
        marginTop: spacing.lg,
        marginBottom: spacing.xxl,
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
