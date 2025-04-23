/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [
    // Add line-clamp plugin for text truncation
    require('@tailwindcss/line-clamp'),
  ],
};
