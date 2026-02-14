import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Linear-inspired dark mode color palette
        linear: {
          bg: {
            primary: '#0D0D0D',      // 메인 배경
            secondary: '#151515',    // 카드 배경
            tertiary: '#1A1A1A',     // 호버 상태
            elevated: '#1F1F1F',     // 모달/패널
          },
          text: {
            primary: '#FFFFFF',
            secondary: '#A0A0A0',
            tertiary: '#6B6B6B',
            quaternary: '#4B4B4B',
          },
          border: {
            DEFAULT: '#2A2A2A',
            subtle: '#1F1F1F',
            focus: '#5E5CE6',
          },
          accent: {
            purple: '#5E5CE6',
            blue: '#0A84FF',
            green: '#30D158',
            red: '#FF453A',
            yellow: '#FFD60A',
            orange: '#FF9F0A',
          },
        },
        // Semantic colors
        primary: '#5E5CE6',
        secondary: '#A0A0A0',
        success: '#30D158',
        warning: '#FFD60A',
        error: '#FF453A',
        up: '#30D158',
        down: '#FF453A',
        // Keep Toss grays for backwards compatibility
        toss: {
          blue: {
            50: '#E8F3FF',
            100: '#C9E2FF',
            200: '#90C2FF',
            300: '#64A8FF',
            400: '#4593FC',
            500: '#3182F6',
            600: '#2272EB',
            700: '#1B64DA',
            800: '#1957C2',
            900: '#194AA6',
          },
          gray: {
            50: '#F9FAFB',
            100: '#F2F4F6',
            200: '#E5E8EB',
            300: '#D1D6DB',
            400: '#B0B8C1',
            500: '#8B95A1',
            600: '#6B7684',
            700: '#4E5968',
            800: '#333D4B',
            900: '#191F28',
          },
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          'Helvetica Neue',
          'Segoe UI',
          'Apple SD Gothic Neo',
          'Noto Sans KR',
          'Malgun Gothic',
          'sans-serif',
        ],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      borderRadius: {
        'linear': '8px',
        'linear-sm': '6px',
        'linear-lg': '12px',
        'linear-xl': '16px',
        'toss': '16px',
        'toss-sm': '12px',
        'toss-lg': '20px',
        'toss-xl': '24px',
      },
      boxShadow: {
        'linear-1': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'linear-2': '0 4px 8px rgba(0, 0, 0, 0.4)',
        'linear-3': '0 8px 16px rgba(0, 0, 0, 0.5)',
        'linear-4': '0 16px 32px rgba(0, 0, 0, 0.6)',
        'linear-glow': '0 0 20px rgba(94, 92, 230, 0.3)',
        'toss-1': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'toss-2': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'toss-3': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'toss-4': '0 12px 32px rgba(0, 0, 0, 0.14)',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'fade-up': 'fadeUp 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'slide-left': 'slideLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-right': 'slideRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.15s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'number-up': 'numberUp 0.3s ease-out',
        'number-down': 'numberDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        numberUp: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        numberDown: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '68': '17rem',
        '88': '22rem',
        '128': '32rem',
      },
      transitionTimingFunction: {
        'linear-ease': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
