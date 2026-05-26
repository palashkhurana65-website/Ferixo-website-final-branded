import type { Config } from "tailwindcss";

export default {
  // THIS IS THE CRITICAL PART: It tells Tailwind to scan the src folder
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--color-canvas)",
        primary: "var(--color-primary)",
        "brand-blue": "var(--color-brand-blue)",
        "brand-orange": "var(--color-brand-orange)",
      },
    },
  },
  plugins: [],
} satisfies Config;