
'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import type { Profile } from '@/lib/types';
import { useUser } from '@/firebase';

interface ProfileContextType {
  activeProfile: Profile | null;
  setActiveProfile: (profile: Profile | null) => void;
  isLoading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const PROFILE_STORAGE_KEY = 'poup-active-profile';

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, loading: userLoading } = useUser();
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // This effect runs once on mount to load the profile from localStorage
  useEffect(() => {
    try {
      const storedProfileJson = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (storedProfileJson) {
        const storedProfile = JSON.parse(storedProfileJson);
        setActiveProfileState(storedProfile);
      }
    } catch (error) {
      console.error('Failed to parse active profile from localStorage', error);
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    }
  }, []);

  // This effect handles user session changes and determines the final loading state
  useEffect(() => {
    if (userLoading) {
      // If user is still loading, we are definitely loading.
      setIsLoading(true);
      return;
    }

    if (!user) {
      // User is logged out, clear everything and stop loading.
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      setActiveProfileState(null);
      setIsLoading(false);
    } else {
      // User is loaded and logged in.
      // At this point, the initial localStorage load attempt has already run.
      // We can now confidently say loading is finished.
      setIsLoading(false);
    }
  }, [user, userLoading]);


  const setActiveProfile = (profile: Profile | null) => {
    setActiveProfileState(profile);
    if (profile) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    }
  };

  const value = useMemo(() => ({ activeProfile, setActiveProfile, isLoading }), [activeProfile, isLoading]);

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
