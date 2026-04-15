import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#070c18",
          card: "#0d1424",
          elevated: "#111827",
          hover: "#1a2235",
          border: "#1e2d45",
        },
        brand: {
          DEFAULT: "#6366f1",
          hover: "#818cf8",
          muted: "#312e81",
        },
        gold: { DEFAULT: "#f59e0b", muted: "#78350f" },
        success: { DEFAULT: "#10b981", muted: "#064e3b" },
        warning: { DEFAULT: "#f59e0b", muted: "#78350f" },
        danger: { DEFAULT: "#ef4444", muted: "#7f1d1d" },
        text: {
          primary: "#f1f5f9",
          secondary: "#94a3b8",
          muted: "#475569",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
