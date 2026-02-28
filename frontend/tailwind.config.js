/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#050505",
          surface: "#0A0A0A",
          "surface-highlight": "#111111"
        },
        border: {
          DEFAULT: "#222222",
          active: "#333333",
          highlight: "#444444"
        },
        text: {
          primary: "#EDEDED",
          secondary: "#A1A1AA",
          muted: "#52525B",
          inverse: "#000000"
        },
        accent: {
          primary: "#00E599",
          secondary: "#FAFF00",
          danger: "#FF2E2E",
          info: "#00B8D4"
        },
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))"
        }
      },
      fontFamily: {
        heading: ["Unbounded", "JetBrains Mono", "monospace"],
        body: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate"
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(0, 229, 153, 0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(0, 229, 153, 0.4)" }
        }
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};
