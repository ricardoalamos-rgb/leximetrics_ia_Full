'use client';

import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { apiClient } from '@/lib/api';

interface KanbanBoardProps {
    initialType?: 'causa' | 'remate';
}

export function KanbanBoard({ initialType = 'causa' }: KanbanBoardProps) {
    const [activeType, setActiveType] = useState<'causa' | 'remate'>(initialType);
    const [boardData, setBoardData] = useState<Record<string, any[]>>({});
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeItem, setActiveItem] = useState<any>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    useEffect(() => {
        loadBoard();
    }, [activeType]);

    const loadBoard = async () => {
        try {
            const endpoint = activeType === 'causa' ? '/kanban/causas' : '/kanban/remates';
            const data = await apiClient.get<Record<string, any[]>>(endpoint);
            setBoardData(data);
        } catch (error) {
            console.error('Error loading kanban:', error);
        }
    };

    const handleDragStart = (event: any) => {
        const { active } = event;
        setActiveId(active.id);
        setActiveItem(active.data.current);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveItem(null);

        if (!over) return;

        const cardId = active.id as string;
        const newStatus = over.id as string;

        // Find current status
        let currentStatus = '';
        for (const [status, items] of Object.entries(boardData)) {
            if (items.find(i => i.id === cardId)) {
                currentStatus = status;
                break;
            }
        }

        if (currentStatus === newStatus) return;

        // Optimistic update
        const newBoard = { ...boardData };
        const itemIndex = newBoard[currentStatus].findIndex(i => i.id === cardId);
        const [item] = newBoard[currentStatus].splice(itemIndex, 1);

        // Update item status locally if needed (though backend handles it)
        item.estado = newStatus;

        if (!newBoard[newStatus]) newBoard[newStatus] = [];
        newBoard[newStatus].push(item);

        setBoardData(newBoard);

        // API Call
        try {
            await apiClient.patch('/kanban/move', {
                type: activeType,
                id: cardId,
                newState: newStatus
            });
        } catch (error) {
            console.error('Error moving card:', error);
            // Revert on error (could implement reload)
            loadBoard();
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Controls */}
            <div className="flex gap-4 mb-4 px-4">
                <button
                    onClick={() => setActiveType('causa')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeType === 'causa'
                            ? 'bg-lex-primary text-white shadow-lg shadow-lex-primary/20'
                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                        }`}
                >
                    🏛️ Causas
                </button>
                <button
                    onClick={() => setActiveType('remate')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeType === 'remate'
                            ? 'bg-lex-primary text-white shadow-lg shadow-lex-primary/20'
                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                        }`}
                >
                    🔨 Remates
                </button>
            </div>

            {/* Board */}
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="flex h-full gap-4 px-4 pb-4 min-w-max">
                        {Object.entries(boardData).map(([status, items]) => (
                            <KanbanColumn
                                key={status}
                                id={status}
                                title={status}
                                items={items}
                                type={activeType}
                            />
                        ))}
                    </div>
                </div>

                <DragOverlay>
                    {activeId && activeItem ? (
                        <div className="transform rotate-3 opacity-90 cursor-grabbing">
                            <KanbanCard id={activeId} type={activeType} data={activeItem} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
