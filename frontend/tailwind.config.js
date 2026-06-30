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
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-plus-jakarta-sans)', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
