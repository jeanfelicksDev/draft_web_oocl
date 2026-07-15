/**
 * Définition des permissions granulaires pour l'application OOCL.
 * Ces permissions contrôlent l'accès aux fonctionnalités de gestion des Bills of Lading.
 */
export const PERMISSIONS = {
    // Bill of Lading
    BL_WRITE:  "BL_WRITE",
    BL_READ:   "BL_READ",
    BL_DELETE: "BL_DELETE",

    // Administration
    MANAGE_USERS: "manage_users",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Permissions par défaut selon le rôle.
 */
export const ROLE_DEFAULT_PERMISSIONS: Record<string, Permission[]> = {
    ADMIN:  Object.values(PERMISSIONS),
    CLIENT: [PERMISSIONS.BL_WRITE, PERMISSIONS.BL_READ],
};
