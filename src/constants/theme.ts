export const colors = {
    dark: {
        background: '#000000',
        surface: '#111111',
        text: '#FFFFFF',
        textSecondary: '#888888',
        border: '#333333',
        accent: '#FFFFFF',
        success: '#FFFFFF',
        error: '#FF4444',
    },
    light: {
        background: '#FFFFFF',
        surface: '#F5F5F5',
        text: '#000000',
        textSecondary: '#666666',
        border: '#CCCCCC',
        accent: '#000000',
        success: '#000000',
        error: '#CC0000',
    },
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const fontSize = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 48,
};

export const fontFamily = {
    regular: 'RobotoMono_400Regular',
    medium: 'RobotoMono_500Medium',
    bold: 'RobotoMono_700Bold',
};

export const borderRadius = {
    none: 0,
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    round: 9999,
    navBar: 25, // Rounded nav bar
};

export type ThemeType = 'dark' | 'light';
export type ColorScheme = typeof colors.dark;
