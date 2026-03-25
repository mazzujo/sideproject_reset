import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        noto: ["var(--font-noto)", "sans-serif"],
        barlow: ["var(--font-barlow)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
