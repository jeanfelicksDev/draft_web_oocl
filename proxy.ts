import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
    const token = await getToken({ 
        req, 
        secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET 
    });
    const isLoggedIn = !!token;
    const { pathname } = req.nextUrl;

    // Routes accessibles sans authentification
    const isPublicRoute =
        pathname === '/login' ||
        pathname === '/register' ||
        pathname === '/forgot-password' ||
        pathname.startsWith('/reset-password');

    if (isPublicRoute) {
        if (isLoggedIn) return NextResponse.redirect(new URL('/', req.url));
        return NextResponse.next();
    }

    if (!isLoggedIn) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
