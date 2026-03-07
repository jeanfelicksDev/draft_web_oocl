import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";


export const metadata: Metadata = {
    title: "Bill of Lading Generator",
    description: "Generate and save Bills of Lading with a modern interface",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" suppressHydrationWarning>
            <body suppressHydrationWarning>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
