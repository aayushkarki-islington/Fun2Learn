'use client';

import { createContext, useState, ReactNode, useEffect, useContext, useMemo } from "react";

import { Theme } from "../models/types";

interface ThemeContextProps {
    theme: Theme,
    updateTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

interface ThemeProviderProps{
    children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>('light');

    // Setting correct theme from localStorage on initial render
    useEffect(() => {
        if(typeof window !== "undefined") {
            const currentTheme = localStorage.getItem("fun2learn-preferred-theme");
            if(currentTheme === "light" || currentTheme == "dark") {
                setTheme(currentTheme);
            }
        }
    }, [])

    // Updating theme in entire ui after theme change
    useEffect(() => {
        const root = document.documentElement;

        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }, [theme]);


    const updateTheme = (newTheme: Theme) => {
        setTheme((prev) => {
            if (prev === newTheme) return prev;
            localStorage.setItem("fun2learn-preferred-theme", newTheme);
            return newTheme;
        });
    }

    const value : ThemeContextProps = useMemo(() =>({
        theme,
        updateTheme
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