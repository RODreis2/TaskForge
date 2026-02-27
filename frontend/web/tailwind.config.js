/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f6f6f3",
        ink: "#1f2937",
        accent: "#0f766e",
        accentSoft: "#ccfbf1"
      }
    }
  },
  plugins: []
};
