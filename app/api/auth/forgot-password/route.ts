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

        // Mode développement : retourner le lien directement si SMTP non configuré
        const isDevMode = process.env.NODE_ENV !== 'production' || 
                          !process.env.SMTP_USER || 
                          process.env.SMTP_USER === 'votre_email@gmail.com';

        if (isDevMode) {
            const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
            const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
            console.log(`[DEV MODE] Reset link for ${email}: ${resetLink}`);
            return NextResponse.json({ 
                message: `[Mode développement] Lien de réinitialisation généré. Copiez ce lien dans votre navigateur :`,
                devResetLink: resetLink,
                devMode: true,
            });
        }

        // Envoyer l'email (production)
        try {
            await sendPasswordResetEmail(email, resetToken);
        } catch (emailError) {
            console.error('Erreur envoi email:', emailError);
            return NextResponse.json({ error: "Erreur lors de l'envoi de l'email." }, { status: 500 });
        }

        return NextResponse.json({ 
            message: "Si un compte existe, un email de réinitialisation vous a été envoyé."
        });
    } catch (error: any) {
        console.error("Forgot password error:", error?.message || error);
        return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
    }
}
