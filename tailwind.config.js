/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#edf6ff",
          deep: "#dfeaff",
        },
        lilac: {
          50: "#eef6ff",
          100: "#dfeeff",
          200: "#cfe5ff",
          300: "#afd4ff",
          400: "#7eb8ff",
          500: "#2f6adf",
          600: "#244fb7",
          700: "#1d3d8b",
          800: "#17315d",
        },
        ink: "#eaf4ff",
        panel: "#0b1f34",
        surface: "#102b46",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 40px -18px rgba(27, 72, 153, 0.55)",
      },
      borderRadius: {
        xl2: "1.4rem",
      },
    },
  },
  plugins: [],
}
