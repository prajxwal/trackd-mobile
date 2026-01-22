import React from 'react';
import {
    TextInput,
    View,
    StyleSheet,
    TextInputProps,
    ViewStyle,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Typography } from './Typography';
import { spacing, fontSize, fontFamily, borderRadius } from '../../constants/theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
}

export function Input({
    label,
    error,
    containerStyle,
    style,
    ...props
}: InputProps) {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Typography variant="bodySmall" style={styles.label}>
                    {label}
                </Typography>
            )}
            <TextInput
                style={[
                    styles.input,
                    {
                        backgroundColor: colors.surface,
                        borderColor: error ? colors.error : colors.border,
                        color: colors.text,
                        fontFamily: fontFamily.regular,
                    },
                    style,
                ]}
                placeholderTextColor={colors.textSecondary}
                {...props}
            />
            {error && (
                <Typography variant="caption" color={colors.error} style={styles.error}>
                    {error}
                </Typography>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    label: {
        marginBottom: spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderRadius: borderRadius.none, // Straight lines
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: fontSize.md,
    },
    error: {
        marginTop: spacing.xs,
    },
});
