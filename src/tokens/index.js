// Re-export of the tailwind.config.js theme for JS-side use (charts, canvas drawing, inline styles
// that can't reach Tailwind's class system). Keep this in sync with tailwind.config.js by hand —
// there is intentionally no build step generating it, so components should prefer Tailwind classes
// and only reach for these tokens where a class can't apply (e.g. SVG stroke color).
export const colors = {
  green: { 50: '#EFFAF4', 100: '#DDF4E7', 500: '#50BB7F', 700: '#369663' },
  neutral: { 50: '#F8FAFC', 200: '#E2E8F0', 500: '#64748B', 600: '#475569', 900: '#111827' },
  amber: { 500: '#F59E0B' },
  red: { 500: '#EF4444' },
  blue: { 500: '#3B82F6' },
};

export const radius = { button: '12px', input: '12px', card: '16px', pill: '9999px' };

export const duration = { fast: '150ms', standard: '225ms', emphasis: '350ms' };
