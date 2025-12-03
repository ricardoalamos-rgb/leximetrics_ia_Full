'use client';

import { LogoutButton } from './logout-button';

interface DashboardHeaderProps {
    userName: string | null;
    userRole: string | null;
}

export const DashboardHeader = ({ userName, userRole }: DashboardHeaderProps) => {
    return (
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-soft border-b border-lex-border/50 dark:border-gray-700/50 sticky top-0 z-20 animate-slide-down">
            <div className="p-4 flex justify-between items-center">
                {/* Title - always visible on desktop, hidden on mobile */}
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-lex-brand via-lex-primary to-lex-vibrant-cyan tracking-tight">
                            Panel de Control
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            Sistema Legal Inteligente
                        </p>
                    </div>
                </div>

                {/* User Info & Actions */}
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-sm font-semibold text-lex-text dark:text-white">
                            {userName}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                            {userRole}
                        </span>
                    </div>
                    <LogoutButton />
                </div>
            </div>
        </header>
    );
};
