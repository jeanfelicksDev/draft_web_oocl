import { auth } from "@/auth";

export async function getSession() {
    return await auth();
}

export async function getUserId() {
    const session = await getSession();
    return session?.user?.id;
}

export async function isAdmin() {
    const session = await getSession();
    return (session?.user as any)?.role === "ADMIN";
}
