/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#FBF6EF",
          deep: "#F3EADD",
        },
        lilac: {
          50: "#F6F2FB",
          100: "#EAE0F5",
          200: "#D8C7EC",
          300: "#BFA3DE",
          400: "#A483CE",
          500: "#8B69B8",
          600: "#71519C",
          700: "#5A3F7E",
        },
        ink: "#3A3145",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 24px -8px rgba(139, 105, 184, 0.25)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
}
