/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3A0DFF",
        secondary: "#FF6A32",
        dark: "#0F0F16",
        panel: "#1A1A22",
      }
    },
  },
  plugins: [],
}

