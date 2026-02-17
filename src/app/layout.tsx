import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VERSION — Automatiza tu Creatividad",
  description: "La plataforma definitiva de IA y automatización diseñada para la nueva élite de creadores digitales.",
};

import { CreditsProvider } from "@/context/CreditsContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <CreditsProvider>
          {children}
        </CreditsProvider>
      </body>
    </html>
  );
}

