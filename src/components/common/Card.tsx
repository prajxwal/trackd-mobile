import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { spacing, borderRadius } from '../../constants/theme';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    padding?: 'none' | 'small' | 'medium' | 'large';
    bordered?: boolean;
}

export function Card({
    children,
    style,
    padding = 'medium',
    bordered = true,
}: CardProps) {
    const { colors } = useTheme();

    const getPadding = () => {
        switch (padding) {
            case 'none':
                return 0;
            case 'small':
                return spacing.sm;
            case 'large':
                return spacing.lg;
            default:
                return spacing.md;
        }
    };

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: colors.surface,
                    borderColor: bordered ? colors.border : 'transparent',
                    padding: getPadding(),
                },
                style,
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        borderRadius: borderRadius.none, // Straight lines
    },
});
