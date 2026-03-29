/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: "rgb(var(--uoh-brand-50) / <alpha-value>)",
          100: "rgb(var(--uoh-brand-100) / <alpha-value>)",
          200: "rgb(var(--uoh-brand-200) / <alpha-value>)",
          300: "rgb(var(--uoh-brand-300) / <alpha-value>)",
          400: "rgb(var(--uoh-brand-400) / <alpha-value>)",
          500: "rgb(var(--uoh-brand-500) / <alpha-value>)",
          600: "rgb(var(--uoh-brand-600) / <alpha-value>)",
          700: "rgb(var(--uoh-brand-700) / <alpha-value>)",
          800: "rgb(var(--uoh-brand-800) / <alpha-value>)",
          900: "rgb(var(--uoh-brand-900) / <alpha-value>)",
        },
        accent: {
          500: "rgb(var(--uoh-accent-500) / <alpha-value>)",
        },
        neutral: {
          0: "rgb(var(--uoh-neutral-0) / <alpha-value>)",
          50: "rgb(var(--uoh-neutral-50) / <alpha-value>)",
          100: "rgb(var(--uoh-neutral-100) / <alpha-value>)",
          200: "rgb(var(--uoh-neutral-200) / <alpha-value>)",
          300: "rgb(var(--uoh-neutral-300) / <alpha-value>)",
          400: "rgb(var(--uoh-neutral-400) / <alpha-value>)",
          500: "rgb(var(--uoh-neutral-500) / <alpha-value>)",
          600: "rgb(var(--uoh-neutral-600) / <alpha-value>)",
          700: "rgb(var(--uoh-neutral-700) / <alpha-value>)",
          800: "rgb(var(--uoh-neutral-800) / <alpha-value>)",
          900: "rgb(var(--uoh-neutral-900) / <alpha-value>)",
        },
        success: {
          DEFAULT: "rgb(var(--uoh-success) / <alpha-value>)",
          50: "rgb(var(--uoh-success-50) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "rgb(var(--uoh-warning) / <alpha-value>)",
          50: "rgb(var(--uoh-warning-50) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--uoh-danger) / <alpha-value>)",
          50: "rgb(var(--uoh-danger-50) / <alpha-value>)",
        },
        info: {
          DEFAULT: "rgb(var(--uoh-info) / <alpha-value>)",
          50: "rgb(var(--uoh-info-50) / <alpha-value>)",
        },
      },
      borderRadius: {
        sm: "var(--uoh-radius-sm)",
        md: "var(--uoh-radius-md)",
        lg: "var(--uoh-radius-lg)",
      },
      boxShadow: {
        sm: "var(--uoh-shadow-sm)",
        md: "var(--uoh-shadow-md)",
        lg: "var(--uoh-shadow-lg)",
      },
      fontFamily: {
        ar: ["var(--uoh-font-ar)"],
        en: ["var(--uoh-font-en)"],
      },
      width: {
        sidebar: "var(--uoh-sidebar-width)",
        "chat-panel": "var(--uoh-chat-panel-width)",
      },
      height: {
        topbar: "var(--uoh-topbar-height)",
      },
    },
  },
};
