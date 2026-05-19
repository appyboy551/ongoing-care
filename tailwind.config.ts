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
      },
      borderRadius: {
        card: "20px",
        "card-lg": "24px",
      },
      fontFamily: {
        sans: [
          "'Segoe UI'",
          "'Helvetica Neue'",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
