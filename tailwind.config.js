/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#061827",
          deep: "#0a2038",
        },
        lilac: {
          50: "#edf6ff",
          100: "#d7ecff",
          200: "#b7d5ff",
          300: "#85b2ff",
          400: "#4f8ef5",
          500: "#0f4ea6",
          600: "#0c3f87",
          700: "#0a2d63",
          800: "#071d3d",
        },
        ink: "#101827",
        panel: "#081a2b",
        surface: "#0d1f35",
      },
      fontFamily: {
        display: ["Calibri", "Segoe UI", "sans-serif"],
        body: ["Calibri", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 40px -18px rgba(20, 86, 182, 0.55)",
      },
      borderRadius: {
        xl2: "1.4rem",
      },
    },
  },
  plugins: [],
}
