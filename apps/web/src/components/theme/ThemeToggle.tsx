'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';

export const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center px-2 py-1 text-xs rounded-md border border-lex-border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
            {theme === 'dark' ? 'Modo claro ☀️' : 'Modo oscuro 🌙'}
        </button>
    );
};
