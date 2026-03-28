import { auth } from "@/auth";

export async function getSession() {
    return await auth();
}

export async function getUserId() {
    const session = await getSession();
    return session?.user?.id;
}

export async function isAdmin() {
    const session = await getSession();
    return (session?.user as any)?.role === "ADMIN";
}

/**
 * Système simplifié de permissions basé sur le rôle.
 * ADMIN : Tout accès.
 * CLIENT : Accès écriture (BL_WRITE) seulement.
 */
export async function hasPermission(requiredPerm: string): Promise<boolean> {
    const session = await getSession();
    if (!session?.user) return false;

    const role = (session.user as any).role || 'CLIENT';

    // ADMIN a tous les droits
    if (role === 'ADMIN') return true;

    // CLIENT a seulement le droit d'écriture/modification de ses propres SI (BL_WRITE)
    if (requiredPerm === "BL_WRITE") return true;

    // Par défaut, pas d'accès aux autres fonctions (Suppression, Tables Ref, Admin)
    return false;
}
