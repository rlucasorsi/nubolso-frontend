import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "#14121b",
        foreground: "#ffffff",
        surface: {
          DEFAULT: '#14121b',
          container: '#1c1a24',
          bright: '#3a3842',
          lowest: '#0f0d16',
        },
        primary: {
          DEFAULT: '#7b5cff',
          variant: '#b77cff',
          container: '#2a2440',
          foreground: '#ffffff',
        },
        success: {
          DEFAULT: '#4ade80',
          foreground: '#ffffff',
        },
        error: {
          DEFAULT: '#f87171',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#fb923c',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        card: {
          DEFAULT: '#1c1a24',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: '#3a3842',
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#f87171',
          foreground: '#ffffff',
        },
      },
      borderRadius: {
        'base': '8px',
        'xl': "1.5rem",
        'lg': "1rem",
        'md': "0.75rem",
        'sm': "0.5rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in-right": "slide-in-right 0.4s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
