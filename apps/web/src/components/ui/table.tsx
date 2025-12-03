import React from 'react';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
    children: React.ReactNode;
    className?: string;
}

export function Table({ children, className, ...props }: TableProps) {
    return (
        <div className="w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-slate-800">
            <table className={`w-full caption-bottom text-sm ${className}`} {...props}>
                {children}
            </table>
        </div>
    );
}

export function TableHeader({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return (
        <thead className={`bg-gray-50 dark:bg-slate-700/50 [&_tr]:border-b ${className}`} {...props}>
            {children}
        </thead>
    );
}

export function TableBody({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return (
        <tbody className={`[&_tr:last-child]:border-0 ${className}`} {...props}>
            {children}
        </tbody>
    );
}

export function TableRow({ children, className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
    return (
        <tr
            className={`border-b transition-colors hover:bg-gray-50/50 data-[state=selected]:bg-gray-100 dark:hover:bg-slate-700/50 dark:data-[state=selected]:bg-slate-800 ${className}`}
            {...props}
        >
            {children}
        </tr>
    );
}

export function TableHead({ children, className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return (
        <th
            className={`h-12 px-4 text-left align-middle font-medium text-gray-500 dark:text-gray-400 [&:has([role=checkbox])]:pr-0 ${className}`}
            {...props}
        >
            {children}
        </th>
    );
}

export function TableCell({ children, className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return (
        <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 text-gray-900 dark:text-gray-100 ${className}`} {...props}>
            {children}
        </td>
    );
}

export function TableCaption({ children, className, ...props }: React.HTMLAttributes<HTMLTableCaptionElement>) {
    return (
        <caption className={`mt-4 text-sm text-gray-500 dark:text-gray-400 ${className}`} {...props}>
            {children}
        </caption>
    );
}
