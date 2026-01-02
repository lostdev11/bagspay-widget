import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./apps/**/*.{js,ts,jsx,tsx,mdx}",
    "./packages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gotsol: {
          mint: "rgb(var(--gotsol-mint) / <alpha-value>)",
          lavender: "rgb(var(--gotsol-lavender) / <alpha-value>)",
          aqua: "rgb(var(--gotsol-aqua) / <alpha-value>)",
          black: "rgb(var(--gotsol-black) / <alpha-value>)",
          white: "rgb(var(--gotsol-white) / <alpha-value>)",
        },
        brand: {
          primary: "rgb(var(--brand-primary) / <alpha-value>)",
          secondary: "rgb(var(--brand-secondary) / <alpha-value>)",
          tertiary: "rgb(var(--brand-tertiary) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
};

export default config;

