/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Poppins", "Pretendard", "system-ui", "sans-serif"],
        sans: ["Pretendard", "Poppins", "system-ui", "sans-serif"],
      },
      boxShadow: {
        neo: "7px 7px 16px rgba(31, 41, 55, 0.10), -7px -7px 16px rgba(255, 255, 255, 0.95)",
        "neo-inset":
          "inset 4px 4px 10px rgba(31, 41, 55, 0.08), inset -4px -4px 10px rgba(255, 255, 255, 0.95)",
      },
    },
  },
  plugins: [],
};
