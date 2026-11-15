import type { Config } from "tailwindcss";

/**
 * NOTA: Com Tailwind CSS v4 a fonte de verdade dos tokens é o bloco
 * `@theme` em `src/app/globals.css`. Este ficheiro existe apenas para
 * IDEs que ainda leem a configuração v3 e para都合os de autocompletar.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FAF6EF",
        surface: "#FFFFFF",
        "surface-soft": "#F2ECE1",
        border: "#E0D8C8",
        "text-primary": "#1F1B17",
        "text-secondary": "#3E4A3D",
        "text-muted": "#6E7B6C",
        primary: "#006B2C",
        "primary-hover": "#005423",
        "primary-soft": "#E3F0E4",
        warm: "#FFDDB0",
        "warm-text": "#281800",
        danger: "#B3261E",
        "danger-soft": "#FBEAE8",
        warning: "#8A5A00",
        "warning-soft": "#FFF4DC",
        success: "#006B2C",
        "success-soft": "#E3F0E4",
      },
      borderRadius: {
        card: "20px",
        input: "14px",
      },
      fontFamily: {
        sans: ["var(--font-atkinson)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
