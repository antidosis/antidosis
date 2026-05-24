import type { Config } from "tailwindcss";
import path from "path";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    path.join(__dirname, "../src/components/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(__dirname, "../src/app/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(__dirname, "../src/lib/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(__dirname, "../src/hooks/**/*.{js,ts,jsx,tsx,mdx}"),
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Inter"',
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        heading: ['"Inter"', "system-ui", "-apple-system", "sans-serif"],
        mono: [
          '"JetBrains Mono"',
          '"SF Mono"',
          '"Fira Code"',
          '"Cascadia Code"',
          "Consolas",
          "monospace",
        ],
        contract: ['"EB Garamond"', "Georgia", '"Times New Roman"', "serif"],
      },
      colors: {
        void: {
          DEFAULT: "#0a0806",
          raised: "#12100e",
          hover: "#1a1714",
          input: "#0f0c0a",
        },
        gold: "#e8d5a3",
        parchment: "#b8a078",
        leather: "#7a6b5a",
        sun: {
          DEFAULT: "#f5a623",
          bright: "#ffb84d",
          dim: "#c47a0a",
        },
        ember: "#ea580c",
        mercury: {
          DEFAULT: "#00e5ff",
          dim: "#00b8d4",
        },
        silver: "#c0b8a8",
        quintessence: {
          DEFAULT: "#b24bf5",
          dim: "#8b5cf6",
        },
        emerald: "#00e676",
        ruby: "#ff5252",
        "amber-alert": "#ffb300",
        bronze: {
          DEFAULT: "#2a2420",
          hover: "#3d3530",
        },
        /* Category semantic colors */
        "cat-goods": "#35e87a",
        "cat-skills": "#33d4f5",
        "cat-money": "#f0cc33",
        "cat-social": "#f57633",
        "cat-lifestyle": "#d76bf5",
        "cat-wildcard": "#f54d99",
      },
      borderRadius: {
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.7s ease-out forwards",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "pulse-slow": "pulseSlow 4s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        blink: "blink 1s step-end infinite",
        ticker: "ticker 40s linear infinite",
        "terminal-fade-in": "terminalFadeIn 0.2s ease forwards",
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
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        terminalFadeIn: {
          "0%": { opacity: "0", transform: "translateY(2px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
