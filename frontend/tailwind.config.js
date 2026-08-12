/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      colors: {
        ink: "#0F172A",
        surface: "#F8FAFC",
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          900: "#312E81",
        },
        violet: {
          500: "#7C3AED",
          600: "#6D28D9",
        },
        tenant: {
          500: "#0891B2",
          600: "#0E7490",
        },
        success: "#059669",
        warning: "#D97706",
        danger: "#DC2626",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
        "brand-gradient-soft": "linear-gradient(135deg, #EEF2FF 0%, #F3E8FF 100%)",
        "tenant-gradient": "linear-gradient(135deg, #0891B2 0%, #4F46E5 100%)",
        "admin-gradient": "linear-gradient(135deg, #0F172A 0%, #4338CA 100%)",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(79,70,229,0.18)",
        "card-hover": "0 4px 12px rgba(15,23,42,0.06), 0 16px 32px -12px rgba(79,70,229,0.28)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
