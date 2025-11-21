import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: ['class'],
    content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		fontSize: {
  			// Native mobile app typography scale
  			'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],      // 12px - Labels, captions
  			'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],  // 14px - Secondary text
  			'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],          // 16px - Body text (iOS standard)
  			'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }], // 18px - Large body
  			'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],  // 20px - Subtitles
  			'2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],     // 24px - Headings
  			'3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }], // 30px - Large headings
  			'4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.03em' }],   // 36px - Hero text
  			// Fluid typography using clamp() for native app feel
  			'fluid-sm': 'clamp(0.875rem, 2vw, 1rem)',
  			'fluid-base': 'clamp(1rem, 2.5vw, 1.125rem)',
  			'fluid-lg': 'clamp(1.125rem, 3vw, 1.25rem)',
  			'fluid-xl': 'clamp(1.25rem, 3.5vw, 1.5rem)',
  			'fluid-2xl': 'clamp(1.5rem, 4vw, 2rem)',
  			'fluid-3xl': 'clamp(1.875rem, 5vw, 2.5rem)',
  		},
  		spacing: {
  			// Native mobile spacing scale (iOS HIG inspired)
  			'0.5': '0.125rem',  // 2px
  			'1': '0.25rem',     // 4px
  			'1.5': '0.375rem',  // 6px
  			'2': '0.5rem',      // 8px
  			'3': '0.75rem',     // 12px
  			'4': '1rem',        // 16px - Base unit
  			'5': '1.25rem',     // 20px
  			'6': '1.5rem',      // 24px
  			'8': '2rem',        // 32px
  			'10': '2.5rem',     // 40px
  			'12': '3rem',       // 48px
  			'16': '4rem',       // 64px
  			'20': '5rem',       // 80px
  			'24': '6rem',       // 96px
  			// Safe area aware spacing
  			'safe-top': 'env(safe-area-inset-top, 1rem)',
  			'safe-bottom': 'env(safe-area-inset-bottom, 1rem)',
  			'safe-left': 'env(safe-area-inset-left, 1rem)',
  			'safe-right': 'env(safe-area-inset-right, 1rem)',
  		},
  		maxWidth: {
  			// Native app content widths
  			'app': '428px',      // iPhone 15 Pro Max width
  			'app-sm': '375px',   // iPhone SE width
  			'app-lg': '430px',   // iPhone 15 Pro Max
  			'tablet': '768px',   // iPad Mini
  		},
  		colors: {
  			orange: {
  				'50': '#FFF5F0',
  				'100': '#FFE6D9',
  				'200': '#FFD4C2',
  				'300': '#FFBFA6',
  				'400': '#FFA07A',
  				'500': '#FF8C69',
  				'600': '#FF6B00',
  				'700': '#E65C00',
  				'800': '#CC5200',
  				'900': '#B34700'
  			},
  			bitcoinOrange: '#F7931A',
  			tiffany: {
  				'50': '#E6F7F7',
  				'100': '#CCEFEF',
  				'200': '#99DFDF',
  				'300': '#66CFCF',
  				'400': '#33BFBF',
  				'500': '#00AFAF',
  				'600': '#008C8C',
  				'700': '#006969',
  				'800': '#004646',
  				'900': '#002323'
  			},
  			gray: {
  				'50': '#f9fafb',
  				'100': '#f3f4f6',
  				'200': '#e5e7eb',
  				'300': '#d1d5db',
  				'400': '#9ca3af',
  				'500': '#6b7280',
  				'600': '#4b5563',
  				'700': '#374151',
  				'800': '#1f2937',
  				'900': '#111827'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-inter)'
  			],
  			display: [
  				'var(--font-playfair-display)'
  			]
  		},
  		scale: {
  			'98': '0.98',
  			'102': '1.02'
  		},
  		animation: {
  			// Native app quality animations
  			'slide-in-right': 'slideInFromRight 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  			'slide-in-left': 'slideInFromLeft 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  			'slide-up': 'slideUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  			'fade-in': 'fadeIn 0.2s ease-out',
  			'fade-in-up': 'fadeInUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  			'scale-in': 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)', // Springy bounce
  			'heart-beat': 'heartBeat 0.3s ease-in-out',
  			'shimmer': 'shimmer 2s linear infinite',
  			'bounce-subtle': 'bounceSubtle 0.5s ease-out',
  			'ripple': 'ripple 0.6s ease-out',
  			// Pull-to-refresh
  			'spin-slow': 'spin 1s linear infinite',
  		},
  		keyframes: {
  			slideInFromRight: {
  				'0%': {
  					opacity: '0',
  					transform: 'translateX(100%)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateX(0)'
  				}
  			},
  			slideInFromLeft: {
  				'0%': {
  					opacity: '0',
  					transform: 'translateX(-100%)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateX(0)'
  				}
  			},
  			slideUp: {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(100%)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			fadeIn: {
  				'0%': { opacity: '0' },
  				'100%': { opacity: '1' }
  			},
  			fadeInUp: {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(10px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			scaleIn: {
  				'0%': {
  					opacity: '0',
  					transform: 'scale(0.9)'
  				},
  				'50%': {
  					transform: 'scale(1.05)' // Slight overshoot
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'scale(1)'
  				}
  			},
  			heartBeat: {
  				'0%': { transform: 'scale(1)' },
  				'25%': { transform: 'scale(1.3)' },
  				'50%': { transform: 'scale(1.1)' },
  				'75%': { transform: 'scale(1.25)' },
  				'100%': { transform: 'scale(1)' }
  			},
  			shimmer: {
  				'0%': { transform: 'translateX(-100%)' },
  				'100%': { transform: 'translateX(100%)' }
  			},
  			bounceSubtle: {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-4px)' }
  			},
  			ripple: {
  				'0%': {
  					transform: 'scale(0)',
  					opacity: '1'
  				},
  				'100%': {
  					transform: 'scale(4)',
  					opacity: '0'
  				}
  			}
  		},
  		borderRadius: {
  			// Native app border radius (iOS style)
  			'none': '0',
  			'sm': '0.375rem',    // 6px - Subtle rounding
  			'DEFAULT': '0.5rem', // 8px - Default
  			'md': '0.625rem',    // 10px - Cards
  			'lg': '0.75rem',     // 12px - Large cards
  			'xl': '1rem',        // 16px - Modals
  			'2xl': '1.25rem',    // 20px - Bottom sheets
  			'3xl': '1.5rem',     // 24px - Special elements
  			'4xl': '2rem',       // 32px - Hero elements
  			'full': '9999px',    // Full circle
  		},
  		boxShadow: {
  			// Native app shadows (iOS style - subtle and layered)
  			'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  			'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  			'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  			'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  			'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  			'2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  			// Card elevation (Material Design inspired, iOS refined)
  			'card': '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
  			'card-hover': '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)',
  			'button': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
  			'button-hover': '0 3px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)',
  			'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  			'none': 'none',
  		},
  		transitionDuration: {
  			'75': '75ms',
  			'100': '100ms',
  			'150': '150ms',
  			'200': '200ms',
  			'250': '250ms',
  			'300': '300ms',
  			'500': '500ms',
  			'700': '700ms',
  			'1000': '1000ms',
  		},
  		transitionTimingFunction: {
  			// Native app easing curves
  			'ease-ios': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // iOS standard
  			'ease-android': 'cubic-bezier(0.4, 0.0, 0.2, 1)',    // Material Design
  			'ease-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',  // Springy
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}

export default config 