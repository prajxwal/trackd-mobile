import React from 'react';
import {
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Typography } from './Typography';
import { spacing, borderRadius } from '../../constants/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
    textStyle?: TextStyle;
    fullWidth?: boolean;
}

export function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    icon,
    style,
    textStyle,
    fullWidth = false,
}: ButtonProps) {
    const { colors, isDark } = useTheme();

    const getButtonStyle = (): ViewStyle => {
        const base: ViewStyle = {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: borderRadius.none, // Straight lines
            borderWidth: 1,
        };

        switch (variant) {
            case 'primary':
                return {
                    ...base,
                    backgroundColor: colors.accent,
                    borderColor: colors.accent,
                };
            case 'secondary':
                return {
                    ...base,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                };
            case 'outline':
                return {
                    ...base,
                    backgroundColor: 'transparent',
                    borderColor: colors.text,
                };
            case 'ghost':
                return {
                    ...base,
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                };
            default:
                return base;
        }
    };

    const getSizeStyle = (): ViewStyle => {
        switch (size) {
            case 'small':
                return { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm };
            case 'large':
                return { paddingVertical: spacing.md, paddingHorizontal: spacing.xl };
            default:
                return { paddingVertical: spacing.sm, paddingHorizontal: spacing.md };
        }
    };

    const getTextColor = (): string => {
        if (disabled) return colors.textSecondary;
        switch (variant) {
            case 'primary':
                return isDark ? '#000000' : '#FFFFFF';
            default:
                return colors.text;
        }
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[
                getButtonStyle(),
                getSizeStyle(),
                disabled && styles.disabled,
                fullWidth && styles.fullWidth,
                style,
            ]}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} size="small" />
            ) : (
                <>
                    {icon && <>{icon}</>}
                    <Typography
                        variant="body"
                        color={getTextColor()}
                        style={[icon ? { marginLeft: spacing.xs } : undefined, textStyle]}
                    >
                        {title}
                    </Typography>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    disabled: {
        opacity: 0.5,
    },
    fullWidth: {
        width: '100%',
    },
});
