import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const isAuthRoute = req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register';

    if (isAuthRoute) {
        if (isLoggedIn) return Response.redirect(new URL('/', req.nextUrl));
        return; // Allow access to login/register
    }

    if (!isLoggedIn) {
        return Response.redirect(new URL('/login', req.nextUrl));
    }
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
