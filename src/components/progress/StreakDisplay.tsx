import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Typography } from '../common/Typography';
import { Card } from '../common/Card';
import { spacing } from '../../constants/theme';
import { Flame } from 'lucide-react-native';

interface StreakDisplayProps {
    currentStreak: number;
    longestStreak: number;
    size?: 'small' | 'large';
}

export function StreakDisplay({
    currentStreak,
    longestStreak,
    size = 'large',
}: StreakDisplayProps) {
    const { colors } = useTheme();

    if (size === 'small') {
        return (
            <View style={styles.smallContainer}>
                <Flame size={16} color={colors.text} />
                <Typography variant="body" bold style={styles.smallText}>
                    {currentStreak}
                </Typography>
            </View>
        );
    }

    return (
        <Card style={styles.container}>
            <View style={styles.iconContainer}>
                <Flame size={48} color={colors.text} />
            </View>
            <Typography variant="display" bold center>
                {currentStreak}
            </Typography>
            <Typography variant="body" center color={colors.textSecondary}>
                day streak
            </Typography>
            <View style={styles.longestContainer}>
                <Typography variant="caption" color={colors.textSecondary}>
                    Longest: {longestStreak} days
                </Typography>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: spacing.lg,
    },
    iconContainer: {
        marginBottom: spacing.sm,
    },
    longestContainer: {
        marginTop: spacing.md,
    },
    smallContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    smallText: {
        marginLeft: spacing.xs,
    },
});
