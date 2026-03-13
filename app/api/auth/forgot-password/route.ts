import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email requis" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json({ message: "Si un compte existe, l'administrateur a été informé." });
        }

        // Générer un mot de passe temporaire lisible (ex: OOCL-1234)
        const tempPass = `OOCL-${Math.floor(1000 + Math.random() * 9000)}`;
        const hashedPassword = await bcrypt.hash(tempPass, 10);

        console.log(`FORGOT PASS: Generated ${tempPass} for ${email}`);

        // Update password and set mustChangePassword flag
        await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
                tempPassword: tempPass,
                mustChangePassword: true,
            } as any, // Cast to any to handle potential stale types in IDE, though functionally correct
        });
        console.log("Successfully updated password via Prisma");

        return NextResponse.json({ 
            message: "Demande envoyée. Votre administrateur vous transmettra votre mot de passe temporaire.",
            debug: `TEMP PASS: ${tempPass}` // Temporary for debug if they can't see the dashboard
        });
    } catch (error) {
        console.error("Forgot password general error:", error);
        return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
    }
}
