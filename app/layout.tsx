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
  title: "Psicobienestar | Psicólogos en línea para Latinoamérica",
  description:
    "Consultas psicológicas online con profesionales certificados. Atención para Guatemala, México, Colombia, Argentina y toda Latinoamérica. Agenda tu cita hoy.",
  keywords:
    "psicólogo online, psicología Guatemala, terapia psicológica latinoamérica, consulta psicológica, salud mental",
  openGraph: {
    title: "Psicobienestar | Psicólogos en línea para Latinoamérica",
    description:
      "Consultas psicológicas online con profesionales certificados. Atención para Guatemala, México, Colombia, Argentina y toda Latinoamérica. Agenda tu cita hoy.",
    url: "https://psicobienestar.vercel.app",
    siteName: "Psicobienestar",
    locale: "es_GT",
    type: "website",
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
