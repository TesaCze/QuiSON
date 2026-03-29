/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        bg: '#f5f4f0',
        surface: '#ffffff',
        surface2: '#f0efe9',
        border: '#e2e0d8',
        accent: {
          DEFAULT: '#2d5be3',
          light: '#e8edfb',
        },
        correct: {
          DEFAULT: '#1a7a4a',
          bg: '#e8f5ee',
        },
        wrong: {
          DEFAULT: '#c13535',
          bg: '#fbeaea',
        },
        warn: {
          DEFAULT: '#b06a00',
          bg: '#fef3e2',
        },
        muted: '#6b6960',
      },
      animation: {
        'fade-up': 'fadeUp 0.25s ease',
        'pulse-slow': 'pulse 0.8s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          'from': { opacity: '0', transform: 'translateY(6px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
