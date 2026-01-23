import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, fontFamily } from '../constants/theme';

import { HomeScreen } from '../screens/HomeScreen';
import { WorkoutsScreen } from '../screens/WorkoutsScreen';
import { NutritionScreen } from '../screens/NutritionScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { BodyScreen } from '../screens/BodyScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

import {
    Home,
    Dumbbell,
    Utensils,
    TrendingUp,
    User as UserIcon,
    Scale,
} from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export function TabNavigator() {
    const { colors } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: true,
                headerStyle: {
                    backgroundColor: colors.background,
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                },
                headerTitleStyle: {
                    fontFamily: fontFamily.bold,
                    color: colors.text,
                },
                tabBarStyle: {
                    backgroundColor: colors.background,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    paddingTop: 6,
                    paddingBottom: 6,
                    height: 65,
                    paddingHorizontal: 0,
                },
                tabBarActiveTintColor: colors.text,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarLabelStyle: {
                    fontFamily: fontFamily.regular,
                    fontSize: 9,
                    marginTop: 2,
                },
                tabBarItemStyle: {
                    paddingHorizontal: 2,
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    headerTitle: 'TRACKD',
                    tabBarIcon: ({ color, size }) => <Home size={size - 4} color={color} />,
                }}
            />
            <Tab.Screen
                name="Workouts"
                component={WorkoutsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Dumbbell size={size - 4} color={color} />,
                }}
            />
            <Tab.Screen
                name="Nutrition"
                component={NutritionScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Utensils size={size - 4} color={color} />,
                }}
            />
            <Tab.Screen
                name="Progress"
                component={ProgressScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <TrendingUp size={size - 4} color={color} />,
                }}
            />
            <Tab.Screen
                name="Body"
                component={BodyScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Scale size={size - 4} color={color} />,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <UserIcon size={size - 4} color={color} />,
                }}
            />
        </Tab.Navigator>
    );
}
