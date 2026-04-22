import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Middleware d'authentification pour Next.js 15/16.
 * NextAuth v5 (Beta) utilise ce fichier à la racine pour protéger les routes.
 * On exporte directement le résultat de NextAuth(authConfig).auth
 */
export default NextAuth(authConfig).auth;

export const config = {
    // Liste des routes à protéger (on exclut les fichiers statiques, api, image)
    matcher: [
        "/((?!api|_next/static|_next/image|.*\\.png|.*\\.ico$).*)",
    ],
};
