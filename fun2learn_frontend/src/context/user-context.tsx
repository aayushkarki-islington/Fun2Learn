'use client'

import { useState, createContext, ReactNode, useEffect } from "react";
import { decodeJwt } from "jose";
import Cookies from "js-cookie";
import { User } from "@/models/types";

interface UserContextProps {
    user: User | null;
}

interface UserProviderProps {
    children: ReactNode;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export function UserProvider({children}: UserProviderProps) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const accessToken = Cookies.get("access_token");
        if(accessToken) {
            
        }
    }, [Cookies]);
}



