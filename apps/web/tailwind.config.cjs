/* eslint-disable @typescript-eslint/no-var-requires */
const preset = require('../../packages/ui/tailwind.preset.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [preset],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};

