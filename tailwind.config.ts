import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{astro,tsx,ts,jsx,js,html,md,mdx}'],
  theme: {
    extend: {
      colors: {
        // Modern fintech palette: bone, ink, lime accent. Bold black on near-white,
        // sliced with one neon-lime highlight. Calm enough to feel premium,
        // sharp enough to feel built today.
        bone: {
          50: '#fafaf7',
          100: '#f4f3ee',
          200: '#e8e6dd',
          300: '#d4d0c4',
          400: '#a8a394',
          500: '#7c776b'
        },
        ink: {
          50: '#f5f5f4',
          100: '#e7e5e4',
          200: '#cfcdcb',
          300: '#9a9695',
          400: '#5b5957',
          500: '#2a2826',
          600: '#1c1b19',
          700: '#121110',
          800: '#0a0a09',
          900: '#050504'
        },
        lime: {
          // Custom shade we pick per-spot. Keeps default Tailwind lime out.
          accent: '#c4f23a',
          accentDark: '#9bc928',
          accentSoft: '#eaf9b6'
        },
        signal: {
          warn: '#f4a83a',
          danger: '#e94f4f',
          ok: '#3fb27f'
        }
      },
      fontFamily: {
        // Pairing: Geist (UI/display) + JetBrains Mono (numbers, codes, IDs).
        // Maps to a more "engineering" feel than OrbitCast or Mira.
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SF Mono', 'monospace']
      },
      letterSpacing: {
        tightest: '-0.04em'
      },
      boxShadow: {
        'edge': '0 1px 0 0 rgba(10,10,9,0.05), 0 0 0 1px rgba(10,10,9,0.06)',
        'pop': '0 12px 30px -8px rgba(10,10,9,0.18)',
        'lime': '0 0 0 4px rgba(196,242,58,0.35)'
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgba(10,10,9,0.04) 1px, transparent 1px),' +
          'linear-gradient(to bottom, rgba(10,10,9,0.04) 1px, transparent 1px)'
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(110%)' }
        }
      },
      animation: {
        scan: 'scan 1.6s ease-in-out infinite'
      }
    }
  },
  plugins: []
} satisfies Config;
