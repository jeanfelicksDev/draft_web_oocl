import { PERMISSIONS, Permission } from "./constants/permissions";

/**
 * Interface utilisateur avec permissions
 */
interface PermissionUser {
    role: string;
    permissions: string | string[];
}

/**
 * Vérifie si un utilisateur possède une permission spécifique.
 * 
 * @param user - L'utilisateur de la session.
 * @param requiredPermission - La permission à vérifier.
 * @returns boolean - true si autorisé, false sinon.
 */
export function hasPermission(user: PermissionUser | null | undefined, requiredPermission: Permission): boolean {
    if (!user) return false;
    
    // Un ADMIN a toutes les permissions par défaut
    if (user.role === "ADMIN") return true;
    
    // Analyse des permissions stockées (JSON ou Array)
    let userPermissions: string[] = [];
    try {
        if (typeof user.permissions === "string") {
            userPermissions = JSON.parse(user.permissions);
        } else if (Array.isArray(user.permissions)) {
            userPermissions = user.permissions;
        }
    } catch (e) {
        console.error("Erreur de formatage des permissions:", e);
        return false;
    }
    
    return userPermissions.includes(requiredPermission);
}

/**
 * Vérifie si l'utilisateur possède AU MOINS UNE des permissions requises.
 */
export function hasAnyPermission(user: PermissionUser | null | undefined, requiredPermissions: Permission[]): boolean {
    return requiredPermissions.some(p => hasPermission(user, p));
}
