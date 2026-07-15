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

        const role = (user as any)?.role || 'CLIENT';

        // CLIENT a toujours le droit d'écriture/lecture de ses propres SI
        // (cohérent avec auth-utils.ts côté serveur)
        if (role === 'CLIENT') {
            if (perm === 'BL_WRITE' || perm === 'BL_READ') return true;
        }

        // Vérification des permissions explicites stockées en session
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
