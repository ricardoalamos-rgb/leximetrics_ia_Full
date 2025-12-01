import React from 'react';

interface RiskBadgeProps {
    score?: number | null;
    label?: 'BAJO' | 'MEDIO' | 'ALTO' | null;
}

export function RiskBadge({ score, label }: RiskBadgeProps) {
    if (score === undefined || score === null || !label) {
        return (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                Riesgo: Pendiente análisis
            </span>
        );
    }

    let colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';

    switch (label) {
        case 'BAJO':
            colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            break;
        case 'MEDIO':
            colorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            break;
        case 'ALTO':
            colorClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            break;
    }

    const percentage = Math.round(score * 100);

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
            Riesgo {label} ({percentage}%)
        </span>
    );
}
