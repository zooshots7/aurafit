import type { Metadata } from "next";
import { Playfair_Display, Inter, Space_Grotesk, Noto_Serif } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-headline",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-label",
  subsets: ["latin"],
  display: "swap",
});

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AuraFit | High-End Editorial Style AI",
  description:
    "Upload your photos. Get your color palette, body type analysis, and 10 outfits picked just for you — in under 30 seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${spaceGrotesk.variable} ${notoSerif.variable}`}>
      <body className="bg-background text-on-surface font-body selection:bg-primary-fixed selection:text-on-primary-fixed antialiased">
        {children}
      </body>
    </html>
  );
}
