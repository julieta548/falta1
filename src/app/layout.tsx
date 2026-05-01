import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Falta1 | Organiza tu partido en segundos",
  description: "La forma más rápida y simple de organizar partidos de fútbol con tus amigos.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${outfit.variable} ${inter.variable} h-full`}>
      <body className="font-inter bg-background text-foreground min-h-full selection:bg-primary/30">
        {children}
      </body>
    </html>
  );
}
