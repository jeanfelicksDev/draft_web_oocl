import { prisma } from './prisma';

/**
 * Vérifie si un utilisateur possède une permission spécifique.
 * Si l'utilisateur est ADMIN, il a toutes les permissions par défaut.
 */
export async function checkPermission(userId: string | undefined, requiredPerm: string): Promise<boolean> {
    if (!userId) return false;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, permissions: true }
        });

        if (!user) return false;
        
        // Un administrateur a tous les droits
        if (user.role === 'ADMIN') return true;

        // Sinon, on vérifie dans le tableau des permissions
        let perms: string[] = [];
        try {
            perms = JSON.parse(user.permissions || '[]');
        } catch {
            perms = [];
        }

        return Array.isArray(perms) && perms.includes(requiredPerm);
    } catch (error) {
        console.error('Error checking permission:', error);
        return false;
    }
}
