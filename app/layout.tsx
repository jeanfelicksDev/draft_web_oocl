import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

/** Corps de texte — lisibilité maximale */
const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

/** Navigation, labels, badges — chaleur & premium */
const plusJakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    variable: "--font-jakarta",
    display: "swap",
    weight: ["400", "500", "600", "700", "800"],
});

/** Titres h1/h2 — géométrique & aéré */
const dmSans = DM_Sans({
    subsets: ["latin"],
    variable: "--font-dm",
    display: "swap",
    weight: ["400", "500", "600", "700", "800"],
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
        <html
            lang="fr"
            suppressHydrationWarning
            className={`${inter.variable} ${plusJakarta.variable} ${dmSans.variable}`}
        >
            <body suppressHydrationWarning className="antialiased">
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
