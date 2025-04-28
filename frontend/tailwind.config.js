// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",   // blue-500
        accent: "#6366f1",    // indigo-500
        surface: "#f9fafb",   // gray-50
        onPrimary: "#ffffff",
        onSurface: "#111827", // gray-900
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
}
