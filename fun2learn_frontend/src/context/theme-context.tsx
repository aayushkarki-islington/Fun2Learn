'use client';

import { createContext, useState, ReactNode, useEffect, useContext, useMemo } from "react";
import { Theme } from "../models/types";
import { setThemeCookie } from "@/app/utils/themeUtils";

interface ThemeContextProps {
    theme: Theme,
    updateTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

interface ThemeProviderProps{
    children: ReactNode
    initialTheme: Theme;
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(initialTheme);

    const updateTheme = (newTheme: Theme) => {
        setTheme((prev) => {
            if (prev === newTheme) return prev;
            setThemeCookie(newTheme);
            return newTheme;
        });
    }

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        setThemeCookie(newTheme);
    };

    const value : ThemeContextProps = useMemo(() =>({
        theme,
        updateTheme,
        toggleTheme
    }), [theme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}