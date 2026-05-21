import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Clinical palette from the existing HTML previews.
        bg: "#f4f6f8",
        card: "#ffffff",
        ink: "#1f2933",
        "ink-soft": "#6b7785",
        line: "#e3e8ed",
        accent: "#a82e7e",
        "accent-soft": "#fbeaf3",
        green: "#2f7d4f",
        "green-bg": "#e7f3ec",
        amber: "#9a6a16",
        "amber-bg": "#fbf0d9",
        red: "#b23b3b",
        "red-bg": "#fbe6e6",
        // David Care Plan design tokens
        cream: "#F6F4EE",
        surface: "#FFFFFF",
        "primary-ink": "#1A1612",
        "secondary-ink": "#5C594F",
        hairline: "#E4E0D6",
        "magenta-text": "#BE185D",
        "magenta-fill": "#DB2777",
        "purple-text": "#6D28A8",
        "purple-fill": "#8B5CF6",
        "teal-text": "#0E7490",
        "teal-fill": "#06B6D4",
        "lime-cta": "#D9F99D",
        "lime-ink": "#0A0A0A",
        // Safety status colours
        "safe-bg": "#1F7A4D",
        "attention-bg": "#B5760A",
        "critical-bg": "#A8252B",
      },
      borderRadius: {
        card: "20px",
        "card-lg": "24px",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-bodoni-moda)", "Georgia", "serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        soft: "0 14px 44px rgba(26,22,18,0.12)",
        "soft-sm": "0 8px 24px rgba(26,22,18,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
