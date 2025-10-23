/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx,css,html}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f2f7ff",
          100: "#dbe8ff",
          200: "#b7d0ff",
          300: "#8aacff",
          400: "#5c86ff",
          500: "#3566ff",
          600: "#1f4df0",
          700: "#1439c8",
          800: "#122f9c",
          900: "#112a7a"
        },
        surface: {
          DEFAULT: "#12121a",
          raised: "#191927",
          subtle: "#1f2033"
        },
        accent: "#ffcf54",
        success: "#4ade80",
        warning: "#f97316",
        danger: "#f43f5e"
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
        display: ["'Clash Display'", "Inter", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 40px rgba(53, 102, 255, 0.25)"
      }
    }
  },
  plugins: []
};
