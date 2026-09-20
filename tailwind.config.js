/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          50: '#EFFAF4',
          100: '#DDF4E7',
          500: '#50BB7F', // primary — LoadMastr Green
          700: '#369663',
        },
        neutral: {
          50: '#F8FAFC',
          200: '#E2E8F0',
          500: '#64748B',
          600: '#475569',
          900: '#111827',
        },
        amber: { 500: '#F59E0B' },
        red: { 500: '#EF4444' },
        blue: { 500: '#3B82F6' },
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      fontSize: {
        h1: ['28px', { lineHeight: '36px', fontWeight: '700' }],
        h2: ['24px', { lineHeight: '32px', fontWeight: '700' }],
        h3: ['20px', { lineHeight: '28px', fontWeight: '600' }],
        h4: ['18px', { lineHeight: '24px', fontWeight: '600' }],
        body: ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        label: ['14px', { lineHeight: '20px', fontWeight: '500' }],
        small: ['12px', { lineHeight: '16px', fontWeight: '400' }],
      },
      borderRadius: { card: '16px', button: '12px', input: '12px', pill: '9999px' },
      transitionDuration: { fast: '150ms', standard: '225ms', emphasis: '350ms' },
      boxShadow: {
        1: '0 1px 2px 0 rgba(17, 24, 39, 0.05)',
        2: '0 4px 12px 0 rgba(17, 24, 39, 0.08)',
        3: '0 12px 32px 0 rgba(17, 24, 39, 0.16)',
      },
    },
  },
  plugins: [],
};
