import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
    id: string;
    title: string;
    items: any[];
    type: 'causa' | 'remate';
}

export function KanbanColumn({ id, title, items, type }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({
        id: id,
    });

    return (
        <div className="flex flex-col min-w-[280px] w-[280px] h-full bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-inherit rounded-t-xl z-10 backdrop-blur-sm">
                <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    {title.replace(/_/g, ' ')}
                </h3>
                <span className="bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs font-bold px-2 py-0.5 rounded-full">
                    {items.length}
                </span>
            </div>

            {/* Droppable Area */}
            <div ref={setNodeRef} className="flex-1 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {items.map((item) => (
                    <KanbanCard key={item.id} id={item.id} type={type} data={item} />
                ))}
            </div>
        </div>
    );
}
