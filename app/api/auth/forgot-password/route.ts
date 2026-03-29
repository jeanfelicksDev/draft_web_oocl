import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from 'crypto';
import { sendPasswordResetEmail } from "@/lib/email";

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
            // Pour des raisons de sécurité, ne pas indiquer si l'utilisateur existe
            return NextResponse.json({ 
                message: "Si un compte existe, un email de réinitialisation vous a été envoyé." 
            });
        }

        // Générer un token sécurisé
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Le token expirera dans 1 heure
        const resetTokenExpiry = new Date(Date.now() + 3600000);

        // Mettre à jour la DB
        await prisma.user.update({
            where: { email },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });

        // Envoyer l'email
        try {
            await sendPasswordResetEmail(email, resetToken);
            console.log(`Email de réinitialisation envoyé avec succès à ${email}`);
        } catch (emailError) {
            console.error('Erreur d\'envoi d\'email:', emailError);
            return NextResponse.json({ error: "Une erreur est survenue lors de l'envoi de l'email." }, { status: 500 });
        }

        return NextResponse.json({ 
            message: "Si un compte existe, un email de réinitialisation vous a été envoyé."
        });
    } catch (error) {
        console.error("Forgot password general error:", error);
        return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
    }
}
