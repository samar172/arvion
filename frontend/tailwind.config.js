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
        // AL-RIZVI palette
        cream: "#f6f1e7",        // page background
        paper: "#fbf7ee",        // header / alt sections
        card: "#fffdf8",         // card background
        line: "#e3dcc9",         // borders
        "line-soft": "#eee6d3",
        emerald: {
          DEFAULT: "#0d3b2c",    // primary
          deep: "#0a2e22",       // footer
          light: "#14523d",      // hover
          soft: "#4a6656",
        },
        gold: {
          DEFAULT: "#c6a15b",    // accent
          light: "#d9bd7f",
          dark: "#9c7a2f",
          muted: "#b0975a",
        },
        sand: "#e6d3a3",         // text on emerald
        "sand-dim": "#d7cfbb",
        ink: {
          DEFAULT: "#16241d",    // headings
          soft: "#2a3c33",       // nav text
          body: "#3d4d43",       // body text
        },
        muted: "#7a8a7f",        // secondary text
        "muted-2": "#9aa89d",
        faded: "#b3ab97",        // struck-through price
        danger: "#a5695f",
      },
      fontFamily: {
        sans: ["var(--font-jost)", "sans-serif"],
        display: ["var(--font-cormorant)", "serif"],
        brand: ["var(--font-marcellus)", "serif"],
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        toastIn: {
          from: { opacity: "0", transform: "translate(-50%, 14px)" },
          to: { opacity: "1", transform: "translate(-50%, 0)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(120%)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        marquee: "marquee 26s linear infinite",
        toast: "toastIn .25s ease",
        fadeUp: "fadeUp .4s ease both",
        slideUp: "slideUp .32s cubic-bezier(.16,1,.3,1) both",
      },
    },
  },
  plugins: [],
};
