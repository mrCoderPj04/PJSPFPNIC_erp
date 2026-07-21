// tailwind.config.js
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        gradientStart: "hsl(221, 80%, 55%)",
        gradientMid: "hsl(260, 80%, 55%)",
        gradientEnd: "hsl(190, 80%, 55%)"
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px"
      },
      borderRadius: {
        lg: "1rem"
      }
    }
  },
  plugins: []
};
