/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Add custom theme extensions if needed
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'), // Add the line-clamp plugin
  ],
};
