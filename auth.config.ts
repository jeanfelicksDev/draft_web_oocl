import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    providers: [],
    trustHost: true,
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isAuthRoute = nextUrl.pathname === '/login' || 
                                nextUrl.pathname === '/register' ||
                                nextUrl.pathname === '/forgot-password' ||
                                nextUrl.pathname.startsWith('/reset-password');

            if (isAuthRoute) {
                if (isLoggedIn) return Response.redirect(new URL('/', nextUrl));
                return true;
            }

            if (!isLoggedIn) return false;
            return true;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.role = (user as any).role;
                
                // Préparation des permissions : on parse le JSON si c'est une chaîne
                let userPermissions = (user as any).permissions;
                if (typeof userPermissions === "string") {
                    try {
                        userPermissions = JSON.parse(userPermissions);
                    } catch (e) {
                        userPermissions = [];
                    }
                }
                token.permissions = userPermissions;
                
                token.companyName = (user as any).companyName;
                token.mustChangePassword = (user as any).mustChangePassword;
                console.log("JWT callback: user.id =", user.id);
            }
            if (trigger === "update" && session) {
                return { ...token, ...session.user };
            }
            return token;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
                (session.user as any).role = token.role;
                (session.user as any).permissions = token.permissions; // Déjà un tableau grâce au JWT
                (session.user as any).companyName = token.companyName;
                (session.user as any).mustChangePassword = token.mustChangePassword;
                console.log("Session callback: userId set to", session.user.id);
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
    },
} satisfies NextAuthConfig; 
