import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Middleware d'authentification pour Next.js 16+.
 * Cette version "proxy" remplace l'ancien middleware.ts pour éviter les conflits
 * et assurer la compatibilité avec l'Edge Runtime.
 */
export const proxy = NextAuth(authConfig).auth;

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|.*\\.png|.*\\.ico$).*)",
    ],
};
