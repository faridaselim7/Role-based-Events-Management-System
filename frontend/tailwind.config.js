/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // all your React components
  ],
  theme: {
    extend: {
      colors: {
        sageHint: "#BFCFBB",
        mint: "#BFCFBB",
        sage: "#8EA58C",
        moss: "#738A6E",
        evergreen: "#344C3D",
      },
      borderRadius: {
        DEFAULT: "0.625rem",
      },
      fontSize: {
        base: "16px",
      },
    },
  },
  plugins: [],
};
