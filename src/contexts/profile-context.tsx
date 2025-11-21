'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import type { Profile } from '@/lib/types';
import { useUser } from '@/firebase';

// Tipo de estado do perfil: Profile (selecionado) | null (nenhum selecionado) | undefined (ainda não checado)
type ActiveProfileState = Profile | null | undefined;

interface ProfileContextType {
  activeProfile: ActiveProfileState;
  setActiveProfile: (profile: Profile | null) => void;
  isLoading: boolean;
}

// O estado inicial é 'undefined' para indicar que a leitura do localStorage ainda não ocorreu.
const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const PROFILE_STORAGE_KEY = 'poup-active-profile';

export function ProfileProvider({ children }: { children: ReactNode }) {
  // Começa como undefined.
  const [activeProfile, setActiveProfileState] = useState<ActiveProfileState>(undefined); 
  const { user, loading: userLoading } = useUser();
  
  // isLoading é verdadeiro se o Firebase está carregando OU se o perfil ainda é undefined (não resolvido).
  const isLoading = userLoading || activeProfile === undefined;

  // Efeito ÚNICO para lidar com sincronização Firebase + LocalStorage
  useEffect(() => {
    // 1. Se o status de autenticação do Firebase ainda está pendente, não faça nada.
    if (userLoading) {
      return;
    }

    // 2. Se o usuário estiver deslogado, limpe tudo e defina o estado como null (resolvido -> nenhum perfil).
    if (!user) {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      setActiveProfileState(null); 
      return;
    }

    // 3. Usuário autenticado: Tenta carregar o perfil do localStorage.
    try {
      const storedProfileJson = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (storedProfileJson) {
        const storedProfile = JSON.parse(storedProfileJson);
        // Atualiza o estado
        setActiveProfileState(storedProfile); 
      } else {
        // Se não houver nada no localStorage, resolve para null.
        setActiveProfileState(null); 
      }
    } catch (error) {
      console.error('Failed to parse active profile from localStorage', error);
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      setActiveProfileState(null); 
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