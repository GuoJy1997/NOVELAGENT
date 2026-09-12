import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bixin: {
          50: '#f5fcf6',
          100: '#eaf7ed',
          200: '#d4f0dc',
          300: '#bae4c4',
          400: '#8bd59f',
          500: '#48be69',
          600: '#1ea44f',
          700: '#11843c',
          800: '#0f6a31',
          900: '#0c5227'
        },
        ink: '#101413',
        mist: '#f7faf7'
      },
      boxShadow: {
        soft: '0 14px 34px rgba(21, 48, 30, 0.06)',
        card: '0 18px 42px rgba(24, 63, 40, 0.06)',
        hero: '0 32px 72px rgba(24, 63, 40, 0.08)'
      },
      borderRadius: {
        '4xl': '32px'
      },
      fontFamily: {
        display: ['"Noto Serif SC"', '"Songti SC"', 'serif'],
        body: ['"PingFang SC"', '"Microsoft YaHei"', '"Noto Sans SC"', 'sans-serif']
      }
    }
  },
  plugins: []
} satisfies Config;
