import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card } from '../ui/card';
import { Calendar, DollarSign, FileText, Gavel, Scale } from 'lucide-react';

interface KanbanCardProps {
    id: string;
    type: 'causa' | 'remate';
    data: any;
}

export function KanbanCard({ id, type, data }: KanbanCardProps) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: id,
        data: { type, ...data },
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="mb-3 touch-none">
            <Card className="p-3 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing border-l-4 border-l-lex-primary">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-lex-primary bg-lex-primary/10 px-2 py-0.5 rounded">
                        {type === 'causa' ? data.rol : 'Remate'}
                    </span>
                    {type === 'causa' && (
                        <span className="text-[10px] text-gray-500">{data.tribunal}</span>
                    )}
                </div>

                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2 mb-2">
                    {type === 'causa' ? data.caratula : `Causa: ${data.causa?.caratula || 'N/A'}`}
                </h4>

                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    {type === 'causa' ? (
                        <>
                            <div className="flex items-center gap-1">
                                <Scale className="w-3 h-3" />
                                <span>Prob: {(data.probabilidadExito * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(data.ultimaGestion).toLocaleDateString()}</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(data.fechaRemate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                <span>Min: ${data.minimo?.toLocaleString()}</span>
                            </div>
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
}
