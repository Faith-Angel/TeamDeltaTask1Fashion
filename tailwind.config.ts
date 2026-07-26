import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#558B2F",
          light: "#7CB342",
          dark: "#33691E",
        },
        accent: {
          DEFAULT: "#F9A825",
          light: "#FDD835",
        },
        background: "#FAFAF5",
        surface: "#FFFFFF",
        textPrimary: "#1B1B1B",
        textSecondary: "#5D4037",
        border: "#E8F5E9",
        error: "#C62828",
        success: "#2E7D32",
        warning: "#F57F17",
        muted: "#F1F8E9",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
