import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { EliteAssistant } from "@/components/ai/EliteAssistant";
import ProtectedRoute from "@/components/ProtectedRoute";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VERSION — Automatiza tu Creatividad",
  description: "La plataforma definitiva de IA y automatización diseñada para la nueva élite de creadores digitales.",
  keywords: ["VERSION", "IA", "automatizacion", "creadores", "YouTube", "video editor", "inteligencia artificial"],
  robots: { index: true, follow: true },
  openGraph: {
    title: "VERSION — Automatiza tu Creatividad",
    description: "La plataforma definitiva de IA para creadores digitales.",
    type: "website",
    locale: "es_ES",
    siteName: "VERSION",
  },
  twitter: {
    card: "summary_large_image",
    title: "VERSION — Automatiza tu Creatividad",
    description: "Herramientas de IA de grado industrial para creadores de contenido.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning className="scroll-smooth">
      {/* Inline script prevents flash-of-wrong-theme */}
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
          try {
            var t = localStorage.getItem('version_theme');
            if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            if (t === 'light') document.documentElement.classList.add('light');
          } catch(e) {}
        ` }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <ProtectedRoute>
              {children}
              <EliteAssistant />
            </ProtectedRoute>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
