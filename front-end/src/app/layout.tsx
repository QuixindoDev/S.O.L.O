import type { Metadata } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";

const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
  display: "swap",
});

export const metadata: Metadata = {
  title: "S.O.L.O. Campo Amigo | NASA Space Apps 2026",
  description:
    "Suporte à decisão para a agricultura familiar em Angola, com dados de satélite da NASA. Feito para ser simples de usar.",
  keywords: [
    "NASA Space Apps",
    "Campo Amigo",
    "Agricultura",
    "Angola",
    "NASA POWER",
    "SMAP",
    "Rotação de Culturas",
  ],
  openGraph: {
    locale: "pt_PT",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT" className={`${atkinson.variable} scroll-smooth`}>
      <body className="bg-bg text-text-primary antialiased">{children}</body>
    </html>
  );
}
