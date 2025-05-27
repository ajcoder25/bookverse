/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        "category-hover": "category-hover 0.3s ease-in-out",
      },
      keyframes: {
        "category-hover": {
          "0%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" },
          "100%": { transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
