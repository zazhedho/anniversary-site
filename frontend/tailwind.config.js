/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2b2220",
        clay: "#9c4f46",
        rosewood: "#6f332f",
        parchment: "#fff7ef",
      },
      fontFamily: {
        display: ["'Cormorant Garamond'", "serif"],
        sans: ["'Manrope'", "sans-serif"],
      },
      boxShadow: {
        glow: "0 14px 40px rgba(114, 51, 44, 0.22)",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        drift: "drift 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
