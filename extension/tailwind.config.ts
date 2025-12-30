import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,html}"],
  theme: {
    extend: {
      colors: {
        brand: {
          1: "#3b82f6",
          2: "#8b5cf6",
        },
        bg: {
          page: "#fafafa",
        },
        text: {
          primary: "#0a0a0a",
          secondary: "#6b7280",
          body: "#374151",
        },
      },
    },
  },
  plugins: [],
};

export default config;
