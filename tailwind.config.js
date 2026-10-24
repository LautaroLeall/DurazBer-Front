/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#ac332a",
        "primary-container": "#ff6f61",
        "on-primary": "#ffffff",
        "on-primary-container": "#6f0205",
        "primary-fixed": "#ffdad5",
        "primary-fixed-dim": "#ffb4aa",
        "secondary": "#1a6d0e",
        "secondary-container": "#a1f889",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#227415",
        "secondary-fixed": "#a1f889",
        "secondary-fixed-dim": "#86db70",
        "tertiary": "#934a2a",
        "tertiary-container": "#df8662",
        "tertiary-fixed": "#ffdbce",
        "tertiary-fixed-dim": "#ffb599",
        "background": "#fef8f3",
        "surface": "#fef8f3",
        "surface-dim": "#ded9d4",
        "surface-bright": "#fef8f3",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f8f3ee",
        "surface-container": "#f3ede8",
        "surface-container-high": "#ede7e2",
        "surface-container-highest": "#e7e1dd",
        "on-surface": "#1d1b19",
        "on-surface-variant": "#58413e",
        "outline": "#8c716d",
        "outline-variant": "#e0bfbb",
        "peach-glow": "#ffa07a",
        "peach-cream": "#fff9f4"
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif']
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem'
      },
      boxShadow: {
        'peach-ambient': '0 8px 24px -4px rgba(255, 111, 97, 0.10), 0 2px 6px -1px rgba(45, 36, 33, 0.04)',
        'peach-hero': '0 16px 36px -6px rgba(255, 111, 97, 0.32), inset 0 1px 2px rgba(255, 255, 255, 0.7)',
        'peach-glow': '0 0 24px 2px rgba(255, 160, 122, 0.35)'
      }
    },
  },
  plugins: [],
};
