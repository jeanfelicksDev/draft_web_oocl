'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface AuthContextType {
    user: any;
    status: "loading" | "authenticated" | "unauthenticated";
    hasPermission: (perm: string) => boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();

    const user = session?.user;
    const isAdmin = (user as any)?.role === 'ADMIN';

    const hasPermission = (perm: string) => {
        if ((user as any)?.role === 'ADMIN') return true;
        
        // On récupère les permissions depuis la session (déjà parsées en tableau par auth.config.ts)
        const userPermissions = (user as any)?.permissions || [];
        
        if (Array.isArray(userPermissions)) {
            return userPermissions.includes(perm);
        }
        
        return false;
    };

    return (
        <AuthContext.Provider value={{
            user,
            status,
            hasPermission,
            isAdmin
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
