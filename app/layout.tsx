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
  title: "Psicobienestar | Psicólogos en línea para Latinoamérica",
  description:
    "Terapia psicológica personalizada en Zona 10, Guatemala. Neuropsicología y salud mental para adultos con la Lic. María Eugenia Castillo. Presencial y online.",
  keywords:
    "psicólogo online, psicología Guatemala, terapia psicológica latinoamérica, consulta psicológica, salud mental",
  openGraph: {
    title: "Psicobienestar | Psicólogos en línea para Latinoamérica",
    description:
      "Terapia psicológica personalizada en Zona 10, Guatemala. Neuropsicología y salud mental para adultos con la Lic. María Eugenia Castillo. Presencial y online.",
    url: "https://psicobienestarguatemala.com",
    siteName: "Psicobienestar",
    locale: "es_GT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Psicobienestar | Psicólogos en línea para Latinoamérica",
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
