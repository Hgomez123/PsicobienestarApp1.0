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
  metadataBase: new URL("https://psicobienestarguatemala.com"),
  alternates: {
    canonical: "https://psicobienestarguatemala.com",
  },
  title: "Psicobienestar | Psicóloga en Zona 10, Guatemala",
  description:
    "Terapia psicológica personalizada en Zona 10, Guatemala. Neuropsicología y salud mental para adultos con la Lic. María Eugenia Castillo. Presencial y online.",
  keywords:
    "psicóloga Guatemala, psicólogos Guatemala, psicología Guatemala, terapia psicológica Guatemala, neuropsicología Guatemala, psicóloga Zona 10, terapia ansiedad Guatemala, terapia depresión Guatemala, salud mental Guatemala",
  openGraph: {
    title: "Psicobienestar | Psicóloga en Zona 10, Guatemala",
    description:
      "Terapia psicológica personalizada en Zona 10, Guatemala. Neuropsicología y salud mental para adultos con la Lic. María Eugenia Castillo. Presencial y online.",
    url: "https://psicobienestarguatemala.com",
    siteName: "Psicobienestar",
    locale: "es_GT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Psicobienestar | Psicóloga en Zona 10, Guatemala",
    description:
      "Terapia psicológica personalizada en Zona 10, Guatemala. Neuropsicología y salud mental para adultos con la Lic. María Eugenia Castillo. Presencial y online.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
