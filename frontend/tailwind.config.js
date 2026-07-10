/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          emerald: '#065f46',      // Primary container green
          emeraldDark: '#004532',  // Deep emerald
          gold: '#fe932c',         // Gold accents
          goldDark: '#904d00',     // Dark gold / ratings
          mint: '#f0fdf4',         // Background of cards/prayer widget
          bg: '#f9f9ff',           // Base background
          text: '#141b2b',         // Dark charcoal text
        },
        "on-secondary-fixed": "#2c1500",
        "outline-variant": "#c0c9c1",
        "tertiary": "#39656b",
        "on-background": "#191c1b",
        "on-surface": "#191c1b",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#2c1500",
        "secondary-container": "#ffdcbe",
        "surface-container-high": "#e9efeb",
        "tertiary-fixed": "#ccebf2",
        "secondary": "#7a5733",
        "on-tertiary-container": "#001f23",
        "on-primary-fixed-variant": "#005141",
        "on-primary-fixed": "#002018",
        "on-tertiary": "#ffffff",
        "on-surface-variant": "#404943",
        "secondary-fixed": "#f9dbbd",
        "primary-fixed": "#53deba",
        "on-primary-container": "#002018",
        "primary": "#006b56",
        "on-primary": "#ffffff",
        "surface-container-lowest": "#ffffff",
        "tertiary-container": "#1f4d53",
        "primary-container": "#005141",
        "surface-container-low": "#f3f9f5",
        "surface-container": "#eef5f0",
        "secondary-fixed-dim": "#dcb999",
        "on-tertiary-fixed": "#001f23",
        "surface": "#f9f9ff",
        "outline": "#707973",
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "background": "#fbfdf9",
        "on-tertiary-fixed-variant": "#1f4d53",
        "primary-fixed-dim": "#33c29f",
        "on-secondary-fixed-variant": "#5e401e",
        "surface-variant": "#dce5dd"
      },
      spacing: {
        "md": "16px",
        "xs": "4px",
        "gutter": "12px",
        "container-margin": "16px",
        "lg": "24px",
        "base": "4px",
        "xl": "32px",
        "sm": "8px"
      },
      fontSize: {
        "badge-micro": ["10px", { lineHeight: "12px", letterSpacing: "0.5px" }],
        "label-bold": ["12px", { lineHeight: "16px", letterSpacing: "0.5px", fontWeight: "700" }],
        "headline-md": ["28px", { lineHeight: "36px" }],
        "title-md": ["16px", { lineHeight: "24px", letterSpacing: "0.15px", fontWeight: "500" }],
        "body-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.4px" }],
        "body-md": ["14px", { lineHeight: "20px", letterSpacing: "0.25px" }],
      },
      fontWeight: {
        "label-bold": "700",
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-plus-jakarta-sans)', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
