import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Void/console base -- a cool near-black, not flat #000.
        charcoal: {
          950: "#0a0d11",
          900: "#10141a",
          800: "#161b22",
          700: "#212832",
          600: "#2c3543",
          500: "#3a4453"
        },
        // Primary signature accent -- action, success, protection.
        neon: {
          600: "#00c482",
          500: "#00e39a",
          400: "#3fffc0"
        },
        // Secondary accent -- analysis, intelligence, info. Paired with
        // neon so the identity reads as a considered duo, not a single
        // acid-green-on-black default.
        violet: {
          600: "#6c5ce0",
          500: "#8b7cff",
          400: "#afa3ff"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "sans-serif"],
        body: ["var(--font-body)", "ui-sans-serif", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      boxShadow: {
        neon: "0 0 0 1px rgba(0,227,154,0.35), 0 0 24px rgba(0,227,154,0.14)",
        violet: "0 0 0 1px rgba(139,124,255,0.35), 0 0 24px rgba(139,124,255,0.14)"
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, rgba(0,227,154,0.06), transparent 60%), radial-gradient(ellipse 80% 60% at 50% -10%, rgba(139,124,255,0.12), transparent)"
      }
    }
  },
  plugins: []
};

export default config;
