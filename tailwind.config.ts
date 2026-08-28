import type { Config } from "tailwindcss";

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // semantic tokens
        app: v("bg"),
        surface: { DEFAULT: v("surface"), 2: v("surface-2"), 3: v("surface-3") },
        line: v("line"),
        t1: v("t1"),
        t2: v("t2"),
        t3: v("t3"),
        // brand + accents
        brand: { DEFAULT: v("brand"), light: v("brand"), dark: v("brand") },
        sky: v("sky"),
        teal: v("teal"),
        grn: v("grn"),
        amber: v("amber"),
        red: v("red"),
        violet: v("violet"),
        accent: { DEFAULT: v("sky"), teal: v("teal"), grn: v("grn"), amber: v("amber"), red: v("red"), violet: v("violet") },
        // legacy aliases (kept so existing classes resolve to theme tokens)
        ink: { DEFAULT: v("bg"), 900: v("bg"), 800: v("surface-2"), 700: v("surface-3"), 600: v("line") },
        panel: { DEFAULT: v("surface-2"), card: v("surface"), line: v("line") },
        muted: { DEFAULT: v("t3"), dim: v("t3") },
      },
      boxShadow: { card: "var(--shadow)", pop: "var(--shadow-lg)" },
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"], mono: ["var(--font-mono)", "monospace"] },
    },
  },
  plugins: [],
};
export default config;
