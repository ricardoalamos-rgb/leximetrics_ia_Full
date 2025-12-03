'use client';

import { KanbanBoard } from '@/components/kanban/KanbanBoard';

export default function KanbanPage() {
    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col animate-fade-in">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Gestión Visual
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Visualiza y gestiona el flujo de trabajo de tus causas y remates.
                </p>
            </div>

            <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4">
                <KanbanBoard />
            </div>
        </div>
    );
}
