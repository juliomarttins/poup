"use client"

import React, { createContext, useContext, useEffect, useState, useMemo } from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"

type ColorTheme = "default" | "verde" | "roxo" | "rosa";

type ThemeContextState = {
  colorTheme: ColorTheme
  setColorTheme: (color: ColorTheme) => void
}

const ThemeContext = createContext<ThemeContextState>({
  colorTheme: "default",
  setColorTheme: () => null,
})

// Wrapper component to handle Color Theme separately from Light/Dark Theme
function ColorThemeProvider({
  children,
  defaultColor = "default",
  colorStorageKey = "vite-ui-color-theme",
}: {
  children: React.ReactNode
  defaultColor?: ColorTheme
  colorStorageKey?: string
}) {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(colorStorageKey) as ColorTheme) || defaultColor;
    }
    return defaultColor;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    // Usamos data-attribute para performance e evitar conflito com classes do Tailwind
    root.setAttribute("data-color-theme", colorTheme);
    localStorage.setItem(colorStorageKey, colorTheme);
  }, [colorTheme, colorStorageKey]);

  const value = useMemo(() => ({
    colorTheme,
    setColorTheme: setColorThemeState
  }), [colorTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Main Provider
export function ThemeProvider({
  children,
  defaultTheme = "system",
  enableSystem = true,
  attribute = "class",
  storageKey = "vite-ui-theme",
  ...props
}: React.ComponentProps<typeof NextThemesProvider> & { defaultColor?: ColorTheme }) {
  return (
    <NextThemesProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      storageKey={storageKey}
      disableTransitionOnChange // Previne flash durante troca de tema
      {...props}
    >
      <ColorThemeProvider defaultColor={props.defaultColor}>
        {children}
      </ColorThemeProvider>
    </NextThemesProvider>
  )
}

// Hook unificado
export const useTheme = () => {
  const nextTheme = useNextTheme();
  const colorContext = useContext(ThemeContext);

  if (colorContext === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return {
    ...nextTheme,
    ...colorContext
  }
}