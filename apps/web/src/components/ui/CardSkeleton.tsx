'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

export const CardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-gray-900 border border-lex-border dark:border-gray-700 rounded-xl p-4 space-y-3 shadow-sm">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-2/3" />
    </div>
);
