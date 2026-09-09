/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#f8f5f1",
          deep: "#f2ece4",
          soft: "#fffdfb",
        },
        lilac: {
          50: "#eef5ff",
          100: "#dfeaff",
          200: "#c3d9ff",
          300: "#9bbcff",
          400: "#6d9af9",
          500: "#2d5bff",
          600: "#234dd4",
          700: "#1d3ea8",
          800: "#1b2f6d",
        },
        ink: "#172033",
        panel: "#ffffff",
        surface: "#f4f7fb",
      },
      fontFamily: {
        display: ["Inter", "Segoe UI", "sans-serif"],
        body: ["Inter", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 40px -20px rgba(29, 62, 168, 0.22)",
      },
      borderRadius: {
        xl2: "1.4rem",
      },
    },
  },
  plugins: [],
}
