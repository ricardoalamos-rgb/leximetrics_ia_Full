import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'link';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
        const baseStyles = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4";

        const variants = {
            primary: "bg-gradient-to-r from-lex-primary to-lex-vibrant-cyan text-white hover:from-lex-vibrant-cyan hover:to-lex-primary shadow-md hover:shadow-xl hover:-translate-y-0.5 focus:ring-lex-primary/30",
            secondary: "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 shadow-sm hover:shadow-md hover:-translate-y-0.5 focus:ring-gray-300/50",
            ghost: "bg-transparent text-lex-primary dark:text-lex-vibrant-cyan hover:bg-lex-primary/10 dark:hover:bg-lex-vibrant-cyan/10 focus:ring-lex-primary/20",
            danger: "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-xl hover:-translate-y-0.5 focus:ring-red-500/30",
            outline: "border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-200",
            link: "text-lex-brand underline-offset-4 hover:underline",
        };

        const sizes = {
            sm: "px-3 py-1.5 text-sm",
            md: "px-4 py-2.5 text-base",
            lg: "px-6 py-3.5 text-lg",
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                {...props}
            >
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
