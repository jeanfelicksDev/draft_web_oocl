export const runtime = "edge";

export function GET(req: Request) {
    return new Response(JSON.stringify({
        hasAuthSecret: !!process.env.AUTH_SECRET,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        authSecretPrefix: process.env.AUTH_SECRET ? process.env.AUTH_SECRET.substring(0, 5) : null,
        cookies: req.headers.get("cookie"),
    }), { status: 200, headers: { "Content-Type": "application/json" } });
}
