'use client';

import { useEffect, useState } from 'react';
import type { Gestion } from '@leximetrics/db';
import { apiClient } from '../../lib/api';
import { TableSkeleton } from '../ui/TableSkeleton';

interface TimelineGestionesProps {
    causaId: string;
    gestiones: Gestion[];
}

export const TimelineGestiones = ({ causaId, gestiones }: TimelineGestionesProps) => {
    const [items, setItems] = useState<Gestion[]>(() =>
        [...(gestiones ?? [])].sort((a, b) => {
            const da = new Date(a.fecha);
            const db = new Date(b.fecha);
            return db.getTime() - da.getTime();
        }),
    );
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLatest = async () => {
        try {
            setLoading(true);
            setError(null);
            // Ajusta este endpoint si en tu API la ruta es distinta (por ejemplo /gestiones?causaId=)
            const data = await apiClient.get<Gestion[]>(`/gestiones/by-causa/${causaId}`);
            const sorted = [...data].sort((a, b) => {
                const da = new Date(a.fecha);
                const db = new Date(b.fecha);
                return db.getTime() - da.getTime();
            });
            setItems(sorted);
        } catch (err: any) {
            console.error('Error cargando gestiones', err);
            setError('No se pudo cargar el historial de gestiones.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Refrescar desde API al montar
        fetchLatest();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [causaId]);

    if (loading && items.length === 0) {
        return <TableSkeleton rows={4} cols={2} />;
    }

    if (items.length === 0 && !loading && !error) {
        return (
            <div className="p-6 bg-white rounded-lg border border-lex-border text-center text-gray-500">
                No hay gestiones registradas aún para esta causa.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header acciones */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-lex-text">Historial de gestiones</h2>
                <button
                    type="button"
                    onClick={fetchLatest}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-lex-border text-lex-text hover:bg-gray-50 disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? 'Actualizando…' : 'Actualizar'}
                </button>
            </div>

            {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700">
                    {error}
                </div>
            )}

            {/* Timeline */}
            <ol className="relative border-l border-lex-border ml-2">
                {items.map((gItem) => {
                    const g = gItem as any;
                    const fecha = new Date(g.fecha);
                    const fechaStr = fecha.toLocaleDateString('es-CL', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                    });
                    const horaStr = fecha.toLocaleTimeString('es-CL', {
                        hour: '2-digit',
                        minute: '2-digit',
                    });

                    return (
                        <li key={g.id} className="mb-6 ml-4">
                            {/* Punto del timeline */}
                            <div className="absolute w-3 h-3 bg-lex-accent rounded-full mt-1.5 -left-1.5 border border-white" />

                            {/* Fecha y cuaderno */}
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="font-medium text-lex-text">
                                        {fechaStr} · {horaStr}
                                    </span>
                                    {g.cuaderno && (
                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                                            Cuaderno {g.cuaderno}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Body */}
                            <div className="mt-2 p-3 bg-white rounded-md border border-lex-border shadow-sm">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <h3 className="text-sm font-semibold text-lex-text">
                                        {g.tipo ?? 'Gestión'}
                                    </h3>
                                    {g.estado && (
                                        <span className="text-[11px] px-2 py-0.5 rounded-full border border-gray-200 text-gray-600">
                                            {g.estado}
                                        </span>
                                    )}
                                </div>
                                {g.descripcion && (
                                    <p className="text-sm text-gray-700 whitespace-pre-line">
                                        {g.descripcion}
                                    </p>
                                )}
                                {g.folio && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        Folio: <span className="font-mono">{g.folio}</span>
                                    </p>
                                )}
                                {g.origen && (
                                    <p className="mt-1 text-[11px] text-gray-400">
                                        Origen: {g.origen}
                                    </p>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
};
