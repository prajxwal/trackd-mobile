import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Typography } from '../common/Typography';
import { Card } from '../common/Card';
import { spacing } from '../../constants/theme';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
}

export function StatCard({ title, value, subtitle, icon }: StatCardProps) {
    const { colors } = useTheme();

    return (
        <Card style={styles.container}>
            <View style={styles.header}>
                {icon && <View style={styles.icon}>{icon}</View>}
                <Typography variant="caption" color={colors.textSecondary}>
                    {title}
                </Typography>
            </View>
            <Typography variant="h2" bold>
                {value}
            </Typography>
            {subtitle && (
                <Typography variant="caption" color={colors.textSecondary}>
                    {subtitle}
                </Typography>
            )}
        </Card>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minWidth: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    icon: {
        marginRight: spacing.xs,
    },
});
