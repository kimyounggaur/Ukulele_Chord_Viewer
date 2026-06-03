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
        neumorphic:
          "9px 9px 18px rgba(31, 41, 55, 0.11), -9px -9px 18px rgba(255, 255, 255, 0.95)",
        "neumorphic-inset":
          "inset 5px 5px 12px rgba(31, 41, 55, 0.08), inset -5px -5px 12px rgba(255, 255, 255, 0.96)",
      },
    },
  },
  plugins: [],
};
