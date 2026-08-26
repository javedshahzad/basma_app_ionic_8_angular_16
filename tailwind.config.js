/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}", // 🔴 هذا هو السطر الأهم
  ],
  theme: {
    extend: {
      // Sourced from src/theme/tokens.scss (docs/ui-audit.md Pass 1).
      // Every value below matches Tailwind's own existing default for
      // that step, so this is purely a re-source, not a redesign — no
      // page outside the ones migrated to the new token classes changes.
      fontSize: {
        "4xs": "var(--font-size-4xs)", // 9px — new, replaces text-[9px]
        "3xs": "var(--font-size-3xs)", // 10px — new, replaces text-[10px]
        "2xs": "var(--font-size-2xs)", // 11px — new, replaces text-[11px]
        xs: "var(--font-size-xs)",
        sm: "var(--font-size-sm)",
        base: "var(--font-size-base)",
        lg: "var(--font-size-lg)",
        xl: "var(--font-size-xl)",
        "2xl": "var(--font-size-2xl)",
        "3xl": "var(--font-size-3xl)",
        "4xl": "var(--font-size-4xl)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
        "4xl": "var(--radius-4xl)", // new, replaces rounded-[2rem]
        full: "var(--radius-full)",
      },
      boxShadow: {
        sm: "var(--elevation-1)",
        DEFAULT: "var(--elevation-1)",
        md: "var(--elevation-2)",
        lg: "var(--elevation-2)",
        xl: "var(--elevation-3)",
        "2xl": "var(--elevation-3)",
        inner: "var(--elevation-inner)",
        lightbox: "var(--shadow-lightbox)",
        "sheet-top": "var(--shadow-sheet-top)",
        "card-soft": "var(--shadow-card-soft)",
      },
      colors: {
        slate: {
          50: "var(--color-neutral-50)",
          100: "var(--color-neutral-100)",
          200: "var(--color-neutral-200)",
          300: "var(--color-neutral-300)",
          400: "var(--color-neutral-400)",
          500: "var(--color-neutral-500)",
          600: "var(--color-neutral-600)",
          700: "var(--color-neutral-700)",
          800: "var(--color-neutral-800)",
          900: "var(--color-neutral-900)",
        },
        indigo: {
          50: "var(--color-accent-50)",
          100: "var(--color-accent-100)",
          400: "var(--color-accent-400)",
          500: "var(--color-accent-500)",
          600: "var(--color-accent-600)",
          700: "var(--color-accent-700)",
        },
        // semantic aliases for the neutral/accent roles pages actually reach for
        surface: "var(--color-surface)",
        "surface-alt": "var(--color-surface-alt)",
        muted: "var(--color-text-muted)",
      },
    },
  },
  plugins: [],
}

