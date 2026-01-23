/**
 * Body Context
 * 
 * Manages body profile state and nutrition calculations.
 * All body data (weight, body fat, profile) is stored in user_body_profile.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { UserBodyProfile, NutritionTargets } from '../types';
import { calculateNutritionTargets } from '../utils/bodyCalculations';

interface BodyContextType {
    profile: UserBodyProfile | null;
    nutritionTargets: (NutritionTargets & { deficitPercent: number }) | null;
    loading: boolean;
    isProfileComplete: boolean;

    // Actions
    fetchProfile: () => Promise<void>;
    updateProfile: (updates: Partial<UserBodyProfile>) => Promise<boolean>;
    refreshData: () => Promise<void>;
}

const BodyContext = createContext<BodyContextType | undefined>(undefined);

export function BodyProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserBodyProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Check if profile has all required fields for calculations
    const isProfileComplete = !!(
        profile?.weight_kg &&
        profile?.height_cm &&
        profile?.age &&
        profile?.sex &&
        profile?.activity_level &&
        profile?.goal_type
    );

    // Calculate nutrition targets when profile changes
    const nutritionTargets: (NutritionTargets & { deficitPercent: number }) | null =
        isProfileComplete && profile
            ? calculateNutritionTargets(
                profile.weight_kg!,
                profile.height_cm!,
                profile.age!,
                profile.sex!,
                profile.activity_level!,
                profile.goal_type!,
                profile.goal_intensity || 'standard',
                profile.body_fat_percent,
                profile.custom_deficit_percent
            )
            : null;

    const fetchProfile = async () => {
        if (!user) return;

        try {
            const { data: profileData } = await supabase
                .from('user_body_profile')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (profileData) {
                setProfile(profileData);
            }
        } catch (error) {
            console.log('Profile fetch:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (updates: Partial<UserBodyProfile>): Promise<boolean> => {
        if (!user) return false;

        try {
            const { error } = await supabase
                .from('user_body_profile')
                .upsert({
                    user_id: user.id,
                    ...profile,
                    ...updates,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;

            setProfile((prev) => (prev ? { ...prev, ...updates } : { user_id: user.id, ...updates }));
            return true;
        } catch (error) {
            console.error('Error updating profile:', error);
            return false;
        }
    };

    const refreshData = async () => {
        setLoading(true);
        await fetchProfile();
    };

    useEffect(() => {
        if (user) {
            fetchProfile();
        } else {
            setProfile(null);
            setLoading(false);
        }
    }, [user]);

    return (
        <BodyContext.Provider
            value={{
                profile,
                nutritionTargets,
                loading,
                isProfileComplete,
                fetchProfile,
                updateProfile,
                refreshData,
            }}
        >
            {children}
        </BodyContext.Provider>
    );
}

export function useBody() {
    const context = useContext(BodyContext);
    if (context === undefined) {
        throw new Error('useBody must be used within a BodyProvider');
    }
    return context;
}
