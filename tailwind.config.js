/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
        // アニメーションの追加
        animation: {
            'fade-in': 'fadeIn 0.3s ease-out',
            'fade-in-up': 'fadeInUp 0.3s ease-out',
            'scale-in': 'scaleIn 0.2s ease-out',
        },
        keyframes: {
            fadeIn: {
                '0%': { opacity: 0 },
                '100%': { opacity: 1 },
            },
            fadeInUp: {
                '0%': { opacity: 0, transform: 'translateY(10px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' },
            },
            scaleIn: {
                '0%': { transform: 'scale(0.95)', opacity: 0 },
                '100%': { transform: 'scale(1)', opacity: 1 },
            },
        },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
