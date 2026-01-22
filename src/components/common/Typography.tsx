import React from 'react';
import { Text as RNText, StyleSheet, TouchableOpacity, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { fontFamily, fontSize } from '../../constants/theme';

interface TypographyProps {
    variant?: 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption';
    color?: string;
    center?: boolean;
    bold?: boolean;
    onPress?: () => void;
    style?: StyleProp<TextStyle>;
    children?: React.ReactNode;
    numberOfLines?: number;
}

export function Typography({
    variant = 'body',
    color,
    center = false,
    bold = false,
    style,
    children,
    onPress,
    numberOfLines,
}: TypographyProps) {
    const { colors } = useTheme();

    const variantStyles: Record<string, TextStyle> = {
        display: { fontSize: fontSize.display, fontFamily: fontFamily.bold },
        h1: { fontSize: fontSize.xxxl, fontFamily: fontFamily.bold },
        h2: { fontSize: fontSize.xxl, fontFamily: fontFamily.bold },
        h3: { fontSize: fontSize.xl, fontFamily: fontFamily.medium },
        body: { fontSize: fontSize.md, fontFamily: fontFamily.regular },
        bodySmall: { fontSize: fontSize.sm, fontFamily: fontFamily.regular },
        caption: { fontSize: fontSize.xs, fontFamily: fontFamily.regular },
    };

    const textStyles: StyleProp<TextStyle> = [
        variantStyles[variant],
        { color: color || colors.text },
        center ? styles.center : undefined,
        bold ? { fontFamily: fontFamily.bold } : undefined,
        style,
    ];

    const textElement = (
        <RNText style={textStyles} numberOfLines={numberOfLines}>
            {children}
        </RNText>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                {textElement}
            </TouchableOpacity>
        );
    }

    return textElement;
}

const styles = StyleSheet.create({
    center: {
        textAlign: 'center',
    },
});

