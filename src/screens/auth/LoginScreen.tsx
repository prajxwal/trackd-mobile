import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Typography, Button, Input } from '../../components/common';
import { spacing } from '../../constants/theme';
import { Dumbbell } from 'lucide-react-native';

export function LoginScreen() {
    const { colors } = useTheme();
    const { signIn, signUp } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        const { error: authError } = isLogin
            ? await signIn(email, password)
            : await signUp(email, password);

        setLoading(false);

        if (authError) {
            setError(authError.message);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                <View style={styles.header}>
                    <Dumbbell size={64} color={colors.text} />
                    <Typography variant="h1" style={styles.title}>
                        TRACKD
                    </Typography>
                    <Typography variant="body" color={colors.textSecondary}>
                        {isLogin ? 'Welcome back' : 'Create your account'}
                    </Typography>
                </View>

                <View style={styles.form}>
                    <Input
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="your@email.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <Input
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="••••••••"
                        secureTextEntry
                    />

                    {error ? (
                        <Typography variant="bodySmall" color={colors.error} style={styles.error}>
                            {error}
                        </Typography>
                    ) : null}

                    <Button
                        title={isLogin ? 'Sign In' : 'Sign Up'}
                        onPress={handleSubmit}
                        loading={loading}
                        fullWidth
                        style={styles.button}
                    />

                    <TouchableOpacity
                        onPress={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                        style={styles.switchButton}
                    >
                        <View style={styles.switchTextContainer}>
                            <Typography variant="body" color={colors.textSecondary}>
                                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                            </Typography>
                            <Typography variant="body" bold={true} color={colors.text}>
                                {isLogin ? 'Sign Up' : 'Sign In'}
                            </Typography>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    title: {
        marginTop: spacing.md,
        letterSpacing: 8,
    },
    form: {
        width: '100%',
    },
    error: {
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    button: {
        marginTop: spacing.md,
    },
    switchButton: {
        marginTop: spacing.lg,
        alignItems: 'center',
    },
    switchTextContainer: {
        flexDirection: 'row',
    },
});
