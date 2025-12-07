import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'gradient';
    children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', children, ...props }, ref) => {
        const variants = {
            default: "bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 shadow-soft hover:shadow-medium",
            glass: "glass-strong border-2 border-white/30 dark:border-white/10 shadow-medium hover:shadow-hard",
            gradient: "bg-gradient-to-br from-white via-blue-50/50 to-cyan-50/30 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border border-white/50 dark:border-gray-600 shadow-medium hover:shadow-hard",
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1",
                    variants[variant],
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn("mb-4", className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);

CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
    children: React.ReactNode;
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <h3
                ref={ref}
                className={cn("text-xl font-bold text-gray-900 dark:text-white", className)}
                {...props}
            >
                {children}
            </h3>
        );
    }
);

CardTitle.displayName = 'CardTitle';

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn("", className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);

CardContent.displayName = 'CardContent';

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
    children: React.ReactNode;
}

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <p
                ref={ref}
                className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
                {...props}
            >
                {children}
            </p>
        );
    }
);
CardDescription.displayName = 'CardDescription';
