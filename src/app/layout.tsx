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
  title: {
    default: "VTLX — Glass, Aluminium & Innovation",
    template: "%s | VTLX",
  },
  description:
    "VTLX distribue des solutions en verre, aluminium, accessoires et mobilité électrique. Découvrez nos produits, solutions et réalisations.",
  keywords: [
    "VTLX",
    "vitres",
    "verre",
    "vitres colorées",
    "aluminium",
    "accessoires",
    "mobilité électrique",
    "mini frigo",
    "top case",
    "e-bike",
  ],
  authors: [{ name: "VTLX" }],
  creator: "VTLX",
  applicationName: "VTLX",
  metadataBase: new URL("https://vtlx.com"),
  openGraph: {
    title: "VTLX — Glass, Aluminium & Innovation",
    description:
      "Vitres, aluminium, accessoires et solutions innovantes.",
    type: "website",
    locale: "fr_FR",
    siteName: "VTLX",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}