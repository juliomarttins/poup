
"use client"

import React, { createContext, useContext, useEffect, useState, useMemo } from "react"

type Theme = "dark" | "light" | "neutral"
type ColorTheme = "default" | "verde" | "roxo" | "rosa";

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  defaultColor?: ColorTheme
  storageKey?: string
  colorStorageKey?: string
  enableSystem?: boolean
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  colorTheme: ColorTheme
  setColorTheme: (color: ColorTheme) => void
}

const initialState: ThemeProviderState = {
  theme: "neutral",
  setTheme: () => null,
  colorTheme: "default",
  setColorTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "neutral",
  defaultColor = "default",
  storageKey = "vite-ui-theme",
  colorStorageKey = "vite-ui-color-theme",
  enableSystem = true,
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() =>
    typeof window !== 'undefined'
      ? (localStorage.getItem(storageKey) as Theme) || defaultTheme
      : defaultTheme
  );
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() =>
    typeof window !== 'undefined'
      ? (localStorage.getItem(colorStorageKey) as ColorTheme) || defaultColor
      : defaultColor
  );

    useEffect(() => {
        const root = window.document.documentElement

        root.classList.remove("light", "dark", "neutral")

        if (theme === "system" && enableSystem) {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
            .matches
            ? "dark"
            : "light"

        root.classList.add(systemTheme)
        return
        }

        root.classList.add(theme)
    }, [theme, enableSystem])


  useEffect(() => {
    const root = window.document.documentElement;
    
    const colorThemes = ["theme-default", "theme-verde", "theme-roxo", "theme-rosa"];
    root.classList.remove(...colorThemes);
    
    if (colorTheme !== "default") {
        root.classList.add(`theme-${colorTheme}`);
    } else {
        root.classList.add('theme-default');
    }

  }, [colorTheme]);


  const setTheme = (theme: Theme) => {
    localStorage.setItem(storageKey, theme);
    setThemeState(theme);
  };

  const setColorTheme = (color: ColorTheme) => {
    localStorage.setItem(colorStorageKey, color);
    setColorThemeState(color);
  };

  const value = useMemo(() => ({
    theme,
    setTheme,
    colorTheme,
    setColorTheme,
  }), [theme, colorTheme]);
  
  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
