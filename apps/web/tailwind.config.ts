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
            colors: {
                lex: {
                    background: "var(--lex-background)",
                    text: "var(--lex-text)",
                    primary: "var(--lex-primary)",
                    secondary: "var(--lex-secondary)",
                    accent: "var(--lex-accent)",
                },
                'lex-bg': '#f3f4f6',
                'lex-text': '#111827',
                'lex-accent': '#2563eb',
                'lex-border': '#e5e7eb',
            },
        },
    },
    plugins: [],
};
export default config;
