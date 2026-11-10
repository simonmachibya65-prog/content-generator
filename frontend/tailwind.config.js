/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
      },
      colors: {
        // ── Brand palette (Buffer-inspired) ──
        brand: {
          green:   '#16A34A',
          'green-hover': '#15803D',
          blue:    '#2563eb',
          indigo:  '#4f46e5',
          purple:  '#7c3aed',
        },
        // ── Warm neutral surfaces ──
        surface: {
          primary:  '#FAFAF9',
          secondary:'#F5F5F4',
          card:     '#FFFFFF',
          elevated: '#F5F5F4',
          muted:    '#FAFAF9',
        },
        // ── Sidebar ──
        sidebar: {
          bg:     '#FFFFFF',
          hover:  '#F5F5F4',
          active: '#DCFCE7',
          border: '#E7E5E4',
          text:   '#57534E',
          'text-active': '#16A34A',
        },
        // ── Dark theme compat (legacy) ──
        dark: {
          base:     '#0f1117',
          surface:  '#1a1f2e',
          card:     '#252b3f',
          elevated: '#2d3447',
          border:   '#2d3748',
          'border-light': '#3a4258',
          hover:    '#303648',
        },
        accent: {
          primary:          '#16A34A',
          secondary:        '#4f46e5',
          'primary-hover':  '#15803D',
          'secondary-hover':'#4338ca',
        },
        success: '#16a34a',
        warning: '#d97706',
        danger:  '#dc2626',
        info:    '#2563eb',
        // ── Social platforms ──
        platform: {
          tiktok:    '#000000',
          youtube:   '#FF0000',
          x:         '#000000',
          instagram: '#E1306C',
          facebook:  '#1877F2',
          linkedin:  '#0A66C2'
        }
      },
      boxShadow: {
        'card':     '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-lg':  '0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'card-xl':  '0 8px 32px rgba(0,0,0,0.1)',
        'blue':     '0 4px 14px rgba(37,99,235,0.25)',
        'inner':    'inset 0 1px 0 rgba(255,255,255,0.8)',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease forwards',
        'fade-in-up': 'fadeInUp 0.4s ease forwards',
        'slide-in':   'slideInLeft 0.3s ease forwards',
        'slide-down': 'slideDown 0.2s ease forwards',
        'shimmer':    'shimmer 1.5s infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-light': 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 50%, #faf5ff 100%)',
        'mesh-blue':  'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
      }
    }
  },
  plugins: []
};
