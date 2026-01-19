// app/actions/theme.ts
'use server';

import { cookies } from 'next/headers';
import { Theme } from '@/models/types';

/**
 * Server Side storage for theme. Helps to store theme data on server side that helps for initial render and avoids hydration.
 * @param theme The theme to be updated "light" | "dark"
 */
export async function setThemeCookie(theme: Theme) {
    const cookieStore = await cookies();
    cookieStore.set({
        name: 'fun2learn-theme',
        value: theme,
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax'
    });
}

/**
 * Get the theme stored in Server side cookies
 * @returns theme - The theme value to be returned. Default is "light"
 */
export async function getThemeCookie(): Promise<Theme> {
    const cookieStore = await cookies();
    const theme = cookieStore.get("fun2learn-theme")?.value ?? "light";
    return theme as Theme;
}

