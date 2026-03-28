import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    providers: [],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isAuthRoute = nextUrl.pathname === '/login' || nextUrl.pathname === '/register';

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
                token.permissions = (user as any).permissions;
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
                (session.user as any).permissions = token.permissions;
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
