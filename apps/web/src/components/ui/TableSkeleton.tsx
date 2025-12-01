'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

interface TableSkeletonProps {
    rows?: number;
    cols?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
    rows = 5,
    cols = 4,
}) => (
    <div className="bg-white dark:bg-gray-900 border border-lex-border dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-lex-border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 h-10" />
        <div className="divide-y divide-lex-border dark:divide-gray-800">
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <div key={rowIdx} className="flex items-center px-4 py-3 gap-4">
                    {Array.from({ length: cols }).map((__, colIdx) => (
                        <Skeleton key={colIdx} className="h-3 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    </div>
);
