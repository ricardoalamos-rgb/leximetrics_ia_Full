import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: 'class',
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Montserrat', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
            },
            colors: {
                lex: {
                    background: "var(--lex-background)",
                    text: "var(--lex-text)",
                    primary: "var(--lex-primary)",
                    secondary: "var(--lex-secondary)",
                    accent: "var(--lex-accent)",
                    brand: '#122950', // Deep Navy
                    'brand-light': '#1e3a6e',
                    'brand-dark': '#0a1a35',
                    'vibrant-green': '#cddc39', // Lime green
                    'vibrant-cyan': '#00bcd4', // Cyan
                    'gold': '#fbbf24', // Gold for accents
                },
                'lex-bg': '#f8fafc', // Lighter, cleaner background
                'lex-text': '#1e293b', // Slate 800 for better readability
                'lex-border': '#e2e8f0',
            },
            animation: {
                'fade-in': 'fadeIn 0.6s ease-out',
                'fade-in-delay': 'fadeIn 0.8s ease-out 0.2s both',
                'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                'slide-down': 'slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                'slide-left': 'slideLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                'slide-right': 'slideRight 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'scale-in': 'scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
                'shimmer': 'shimmer 3s linear infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideLeft: {
                    '0%': { transform: 'translateX(20px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                slideRight: {
                    '0%': { transform: 'translateX(-20px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.9)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                bounceSubtle: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-1000px 0' },
                    '100%': { backgroundPosition: '1000px 0' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(0, 188, 212, 0.2), 0 0 10px rgba(205, 220, 57, 0.1)' },
                    '100%': { boxShadow: '0 0 20px rgba(0, 188, 212, 0.4), 0 0 30px rgba(205, 220, 57, 0.2)' },
                },
            },
            boxShadow: {
                'soft': '0 2px 8px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.06)',
                'medium': '0 4px 16px rgba(0, 0, 0, 0.08), 0 8px 32px rgba(0, 0, 0, 0.12)',
                'hard': '0 8px 32px rgba(0, 0, 0, 0.12), 0 16px 64px rgba(0, 0, 0, 0.16)',
                'glow': '0 0 20px rgba(0, 188, 212, 0.3), 0 0 40px rgba(205, 220, 57, 0.2)',
                'glow-sm': '0 0 10px rgba(0, 188, 212, 0.2), 0 0 20px rgba(205, 220, 57, 0.1)',
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
};
export default config;
