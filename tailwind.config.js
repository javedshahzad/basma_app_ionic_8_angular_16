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
        // rgb(var(...) / <alpha-value>) — NOT a plain var() reference —
        // is required so opacity modifiers keep working, e.g.
        // bg-slate-900/40 or bg-surface-alt/90. A plain var() reference
        // silently resolves to fully transparent under any /NN modifier
        // instead of erroring, so this was caught late (Pass 4) via a
        // live computed-style check, not a build error. See
        // src/theme/tokens.scss's *-rgb triplets.
        slate: {
          50: "rgb(var(--color-neutral-50-rgb) / <alpha-value>)",
          100: "rgb(var(--color-neutral-100-rgb) / <alpha-value>)",
          200: "rgb(var(--color-neutral-200-rgb) / <alpha-value>)",
          300: "rgb(var(--color-neutral-300-rgb) / <alpha-value>)",
          400: "rgb(var(--color-neutral-400-rgb) / <alpha-value>)",
          500: "rgb(var(--color-neutral-500-rgb) / <alpha-value>)",
          600: "rgb(var(--color-neutral-600-rgb) / <alpha-value>)",
          700: "rgb(var(--color-neutral-700-rgb) / <alpha-value>)",
          800: "rgb(var(--color-neutral-800-rgb) / <alpha-value>)",
          900: "rgb(var(--color-neutral-900-rgb) / <alpha-value>)",
        },
        indigo: {
          50: "rgb(var(--color-accent-50-rgb) / <alpha-value>)",
          100: "rgb(var(--color-accent-100-rgb) / <alpha-value>)",
          400: "rgb(var(--color-accent-400-rgb) / <alpha-value>)",
          500: "rgb(var(--color-accent-500-rgb) / <alpha-value>)",
          600: "rgb(var(--color-accent-600-rgb) / <alpha-value>)",
          700: "rgb(var(--color-accent-700-rgb) / <alpha-value>)",
        },
        // semantic aliases for the neutral/accent roles pages actually reach for
        surface: "rgb(var(--color-surface-rgb) / <alpha-value>)",
        "surface-alt": "rgb(var(--color-surface-alt-rgb) / <alpha-value>)",
        muted: "rgb(var(--color-text-muted-rgb) / <alpha-value>)",
      },
    },
  },
  plugins: [],
}

