'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

interface Remate {
    id: string;
    fechaRemate: string;
    minimo: number | null;
    garantia: number | null;
    causa: {
        rol: string;
        caratula: string;
        tribunal: string;
    };
}

export default function RematesPage() {
    const [remates, setRemates] = useState<Remate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await apiClient.get<Remate[]>('/remates/upcoming');
                setRemates(data);
            } catch (err) {
                setError('Error al cargar los remates.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Próximos Remates</h1>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-slate-800">
                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-200 rounded dark:bg-gray-700"></div>)}
                    </div>
                ) : error ? (
                    <div className="text-red-500">{error}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Causa</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Mínimo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Garantía</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-800 dark:divide-gray-700">
                                {remates.map((remate) => (
                                    <tr key={remate.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {new Date(remate.fechaRemate).toLocaleDateString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{remate.causa.rol}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{remate.causa.tribunal}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{remate.causa.caratula}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {remate.minimo ? `$${remate.minimo.toLocaleString('es-CL')}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {remate.garantia ? `$${remate.garantia.toLocaleString('es-CL')}` : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {remates.length === 0 && (
                            <div className="p-4 text-center text-gray-500">No hay remates próximos registrados.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
