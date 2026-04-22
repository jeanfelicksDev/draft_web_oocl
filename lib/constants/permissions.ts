/**
 * Définition des permissions granulaires pour EduGestion.
 * Ces permissions permettent de contrôler l'accès aux fonctionnalités
 * indépendamment du rôle global (ADMIN/USER).
 */
export const PERMISSIONS = {
    // Tableau de bord et accès de base
    VIEW_DASHBOARD: "view_dashboard",
    
    // Gestion des élèves
    VIEW_STUDENTS: "view_students",
    EDIT_STUDENTS: "edit_students",
    DELETE_STUDENTS: "delete_students",
    
    // Notes et Bulletins
    VIEW_GRADES: "view_grades",
    EDIT_GRADES: "edit_grades",
    
    // Activités
    MANAGE_ACTIVITIES: "manage_activities",
    
    // Administration
    MANAGE_USERS: "manage_users",
    VIEW_LOGS: "view_logs",
    
    // Documents OOCL (Compatibilité ascendante)
    MANAGE_BLS: "manage_bls",
    VIEW_REPORTS: "view_reports",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Rôles par défaut et leurs permissions associées.
 */
export const ROLE_DEFAULT_PERMISSIONS: Record<string, Permission[]> = {
    ADMIN: Object.values(PERMISSIONS),
    CLIENT: [PERMISSIONS.VIEW_STUDENTS, PERMISSIONS.VIEW_GRADES],
    TEACHER: [PERMISSIONS.VIEW_STUDENTS, PERMISSIONS.EDIT_GRADES, PERMISSIONS.MANAGE_ACTIVITIES],
};
