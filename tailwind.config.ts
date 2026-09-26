import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme tokens — values come from --c-* CSS vars (globals.css),
        // switched by [data-theme="light"]. Dark theme = original palette.
        void: "rgb(var(--c-void) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        raise: "rgb(var(--c-raise) / <alpha-value>)",
        inset: "rgb(var(--c-inset) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        linehi: "rgb(var(--c-linehi) / <alpha-value>)",
        linestrong: "rgb(var(--c-linestrong) / <alpha-value>)",
        gold: "rgb(var(--c-gold) / <alpha-value>)",
        goldsoft: "rgb(var(--c-goldsoft) / <alpha-value>)",
        goldhi: "rgb(var(--c-goldhi) / <alpha-value>)",
        parchment: "rgb(var(--c-parchment) / <alpha-value>)",
        ash: "rgb(var(--c-ash) / <alpha-value>)",
        ash2: "rgb(var(--c-ash2) / <alpha-value>)",
        leather: "rgb(var(--c-leather) / <alpha-value>)",
        faint: "rgb(var(--c-faint) / <alpha-value>)",
        sun: "rgb(var(--c-sun) / <alpha-value>)",
        sunhi: "rgb(var(--c-sunhi) / <alpha-value>)",
        sundim: "rgb(var(--c-sundim) / <alpha-value>)",
        ember: "rgb(var(--c-ember) / <alpha-value>)",
        alert: "rgb(var(--c-alert) / <alpha-value>)",
        ok: "rgb(var(--c-ok) / <alpha-value>)",
        termgreen: "rgb(var(--c-termgreen) / <alpha-value>)",
        bad: "rgb(var(--c-bad) / <alpha-value>)",
        mercury: "rgb(var(--c-mercury) / <alpha-value>)",
        mercdim: "rgb(var(--c-mercdim) / <alpha-value>)",
        aero: "rgb(var(--c-aero) / <alpha-value>)",
        quint: "rgb(var(--c-quint) / <alpha-value>)",
        quintdim: "rgb(var(--c-quintdim) / <alpha-value>)",
        orchid: "rgb(var(--c-orchid) / <alpha-value>)",
        magenta: "rgb(var(--c-magenta) / <alpha-value>)",
        aqua: "rgb(var(--c-aqua) / <alpha-value>)",
        quintbg: "rgb(var(--c-quintbg) / <alpha-value>)",
        mercurybg: "rgb(var(--c-mercurybg) / <alpha-value>)",
        okbg: "rgb(var(--c-okbg) / <alpha-value>)",
        // Constants — same in both themes.
        onaccent: "#0a0806", // text/icons on top of sun/emerald/ruby fills
        paper: "#f0dfc0", // contract document parchment
        paperbg: "#f5e6c8",
        papersoft: "#e8d5b8",
        paperline: "#d4b896",
        paperink: "#2c1810",
        paperhead: "#1a0f08",
        paperlabel: "#8a7050",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        heading: ["var(--font-sans)", "SF Pro Display", "Segoe UI", "system-ui", "sans-serif"],
        mono: [
          "var(--font-mono)",
          "SF Mono",
          "Fira Code",
          "Cascadia Code",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.7s ease-out forwards",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "pulse-slow": "pulseSlow 4s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        pulseSlow: {
          "0%, 100%": { opacity: "0.6", filter: "brightness(1)" },
          "50%": { opacity: "1", filter: "brightness(1.2)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
