'use client';

import React from 'react';
import clsx from 'clsx';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className,
    rounded = 'md',
    ...props
}) => {
    const roundedCls =
        rounded === 'sm'
            ? 'rounded'
            : rounded === 'lg'
                ? 'rounded-xl'
                : rounded === 'full'
                    ? 'rounded-full'
                    : 'rounded-md';

    return (
        <div
            className={clsx(
                'animate-pulse bg-gray-200 dark:bg-gray-700',
                roundedCls,
                className,
            )}
            {...props}
        />
    );
};
