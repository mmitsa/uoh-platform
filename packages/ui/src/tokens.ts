export const uohTokens = {
  color: {
    // مستوحاة من الهوية المؤسسية (يمكن ضبطها لاحقاً عند استلام دليل الهوية الرسمي)
    brand: {
      50: "#eef7f4",
      100: "#d9eee6",
      200: "#b6dece",
      300: "#8bc9b2",
      400: "#56ae90",
      500: "#2f8f71",
      600: "#24755c",
      700: "#1e5f4c",
      800: "#1b4f40",
      900: "#174236",
    },
    accent: {
      50: "#fff7ed",
      100: "#ffedd5",
      200: "#fed7aa",
      300: "#fdba74",
      400: "#fb923c",
      500: "#f97316",
      600: "#ea580c",
      700: "#c2410c",
      800: "#9a3412",
      900: "#7c2d12",
    },
    neutral: {
      0: "#ffffff",
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1f2937",
      900: "#0f172a",
    },
    semantic: {
      success: "#16a34a",
      warning: "#f59e0b",
      danger: "#dc2626",
      info: "#2563eb",
    },
  },
  typography: {
    fontFamily: {
      arabic: "'Noto Kufi Arabic', ui-sans-serif, system-ui",
      latin: "'Inter', ui-sans-serif, system-ui",
    },
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  radius: {
    xs: "6px",
    sm: "10px",
    md: "14px",
    lg: "18px",
    xl: "24px",
  },
  shadow: {
    sm: "0 1px 2px rgba(15, 23, 42, 0.08)",
    md: "0 6px 16px rgba(15, 23, 42, 0.12)",
    lg: "0 12px 32px rgba(15, 23, 42, 0.18)",
  },
} as const;

export type UohTokens = typeof uohTokens;

