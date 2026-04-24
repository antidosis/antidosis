import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: {
          50: "#f8f7ff",
          100: "#e8e5ff",
          200: "#d4ceff",
          300: "#b8a8ff",
          400: "#9a7eff",
          500: "#7c5cff",
          600: "#6d4aff",
          700: "#5a35e8",
          800: "#4a2dbf",
          900: "#3d2699",
          950: "#1a1033",
          1000: "#0d081a",
        },
        neon: {
          cyan: "#00f0ff",
          purple: "#b829f7",
          pink: "#ff006e",
          lime: "#39ff14",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-glow":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 50, 255, 0.15), transparent)",
        "card-glow":
          "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(120, 50, 255, 0.08), transparent)",
        "accent-gradient":
          "linear-gradient(135deg, #7c5cff 0%, #b829f7 50%, #ff006e 100%)",
        "accent-gradient-subtle":
          "linear-gradient(135deg, rgba(124,92,255,0.15) 0%, rgba(184,41,247,0.1) 100%)",
      },
      boxShadow: {
        glow: "0 0 40px rgba(124, 92, 255, 0.15)",
        "glow-sm": "0 0 20px rgba(124, 92, 255, 0.1)",
        "glow-lg": "0 0 80px rgba(124, 92, 255, 0.2)",
        neon: "0 0 20px rgba(0, 240, 255, 0.3)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.7s ease-out forwards",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
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
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
