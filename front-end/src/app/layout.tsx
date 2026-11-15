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
    <html
      lang="pt-BR"
      className={`${atkinson.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      {/* `suppressHydrationWarning`: algumas extensões de browser
          (ex.: ChatGPT/Codex) injectam atributos no <body> antes do
          React arrancar, o que provoca um aviso de hydration mismatch
          que não tem nada a ver com o nosso código. */}
      <body
        className="bg-bg text-text-primary antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
