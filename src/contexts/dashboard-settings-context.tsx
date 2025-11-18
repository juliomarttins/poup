"use client";

import React, { createContext, useContext, useState, useMemo } from 'react';

interface DashboardSettings {
  showStats: boolean;
  showOverviewChart: boolean;
  showDebtChart: boolean;
  showRecentTransactions: boolean;
}

interface DashboardSettingsContextType {
  settings: DashboardSettings;
  setSettings: React.Dispatch<React.SetStateAction<DashboardSettings>>;
}

const defaultSettings: DashboardSettings = {
  showStats: true,
  showOverviewChart: true,
  showDebtChart: true,
  showRecentTransactions: true,
};

const DashboardSettingsContext = createContext<DashboardSettingsContextType | undefined>(undefined);

export function DashboardSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<DashboardSettings>(defaultSettings);

  const value = useMemo(() => ({ settings, setSettings }), [settings]);

  return (
    <DashboardSettingsContext.Provider value={value}>
      {children}
    </DashboardSettingsContext.Provider>
  );
}

export function useDashboardSettings() {
  const context = useContext(DashboardSettingsContext);
  if (!context) {
    throw new Error('useDashboardSettings must be used within a DashboardSettingsProvider');
  }
  return context;
}
