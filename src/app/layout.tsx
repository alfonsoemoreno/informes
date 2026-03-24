import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { UserButton } from "@neondatabase/auth/react";
import { AuthProvider } from "@/components/auth/auth-provider";
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
  title: "Informes de Predicacion",
  description: "Aplicacion multi-tenant para administrar informes mensuales de predicacion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <AuthProvider>
          <header className="topbar">
            <div className="app-shell topbar-inner">
              <div className="brand-block">
                <span className="eyebrow">Congregaciones</span>
                <Link className="brand-title" href="/">
                  Informes de Predicacion
                </Link>
                <span className="brand-subtitle">
                  Next.js + Neon Auth + Drizzle
                </span>
              </div>

              <nav className="topbar-nav">
                <Link className="pill-link" href="/">
                  Inicio
                </Link>
                <Link className="pill-link" href="/dashboard">
                  Dashboard
                </Link>
                <Link className="pill-link" href="/auth/sign-in">
                  Ingresar
                </Link>
              </nav>

              <div className="user-area">
                <span className="brand-subtitle">Acceso por rol y congregacion</span>
                <UserButton />
              </div>
            </div>
          </header>

          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
