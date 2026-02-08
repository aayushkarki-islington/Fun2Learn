'use client'

import { useState, useContext, createContext, ReactNode, useEffect } from "react";
import Cookies from "js-cookie";
import { User } from "@/models/types";
import { getUserData } from "@/api/authApi";

interface UserContextProps {
    user: User | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
}

interface UserProviderProps {
    children: ReactNode;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export function UserProvider({children}: UserProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        const token = Cookies.get("accessToken");
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        const data = await getUserData();
        setUser(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, loading, refreshUser: fetchUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}

