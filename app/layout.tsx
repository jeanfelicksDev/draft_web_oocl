import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "Bill of Lading Generator — OOCL",
    description: "Plateforme cloud de gestion documentaire maritime de très haute qualité.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" suppressHydrationWarning className={inter.variable}>
            <body suppressHydrationWarning className="font-sans antialiased">
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
