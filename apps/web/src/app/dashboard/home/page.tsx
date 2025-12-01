'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

interface HomeResponse {
    causasEnRojo?: any[];
    audienciasHoy?: any[];
    borradoresPendientes?: any[];
    tareasOperativas?: any[];
    gestionesFisicasHoy?: any[];
}

export default function MyLegalDayPage() {
    const [data, setData] = useState<HomeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await apiClient.get<HomeResponse>('/home');
                setData(response);
            } catch (err) {
                console.error('Error fetching home data:', err);
                setError('No se pudo cargar la información de Mi Día.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="p-6">
                <h1 className="text-3xl font-bold text-lex-text mb-6">Mi Día Legal</h1>
                <div className="animate-pulse space-y-4">
                    <div className="h-32 bg-gray-200 rounded-lg"></div>
                    <div className="h-32 bg-gray-200 rounded-lg"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <h1 className="text-3xl font-bold text-lex-text mb-6">Mi Día Legal</h1>
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-lex-text">Mi Día Legal</h1>
                <p className="text-gray-500">Resumen de tus prioridades para hoy.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Causas en Rojo */}
                {data?.causasEnRojo && data.causasEnRojo.length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-semibold text-red-600 mb-4 flex items-center">
                            <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                            Causas en Rojo Hoy
                        </h2>
                        <ul className="space-y-3">
                            {data.causasEnRojo.map((causa: any) => (
                                <li key={causa.id} className="border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                                    <Link href={`/dashboard/causas/${causa.id}`} className="hover:text-lex-primary transition-colors">
                                        <div className="font-medium">{causa.caratula}</div>
                                        <div className="text-sm text-gray-500">{causa.rol} - {causa.tribunal}</div>
                                        <div className="text-xs text-red-500 mt-1">
                                            {causa.riesgoInactividad === 'ROJO' ? 'Inactividad Crítica' : 'Riesgo Procesal Alto'}
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 text-right">
                            <Link href="/dashboard/causas-rojas" className="text-sm text-lex-primary hover:underline">
                                Ver todas &rarr;
                            </Link>
                        </div>
                    </div>
                )}

                {/* Borradores Pendientes */}
                {data?.borradoresPendientes && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-semibold text-lex-text mb-4">Borradores Listos</h2>
                        {data.borradoresPendientes.length === 0 ? (
                            <p className="text-gray-400 italic">No hay borradores pendientes.</p>
                        ) : (
                            <ul className="space-y-3">
                                {data.borradoresPendientes.map((borrador: any, index: number) => (
                                    <li key={index} className="flex justify-between items-center">
                                        <span>{borrador.nombre || 'Documento sin nombre'}</span>
                                        <button className="text-xs bg-lex-primary text-white px-2 py-1 rounded hover:bg-lex-primary/90">
                                            Revisar
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* Tareas Operativas */}
                {data?.tareasOperativas && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-semibold text-lex-text mb-4">Tareas Operativas</h2>
                        {data.tareasOperativas.length === 0 ? (
                            <p className="text-gray-400 italic">No hay tareas pendientes.</p>
                        ) : (
                            <ul className="space-y-3">
                                {data.tareasOperativas.map((tarea: any) => (
                                    <li key={tarea.id} className="flex items-center gap-2">
                                        <input type="checkbox" className="rounded text-lex-primary focus:ring-lex-primary" />
                                        <span className="text-gray-700">{tarea.title}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* Gestiones Físicas */}
                {data?.gestionesFisicasHoy && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-semibold text-lex-text mb-4">Gestiones en Terreno</h2>
                        {data.gestionesFisicasHoy.length === 0 ? (
                            <p className="text-gray-400 italic">No hay gestiones físicas para hoy.</p>
                        ) : (
                            <ul className="space-y-3">
                                {data.gestionesFisicasHoy.map((gestion: any) => (
                                    <li key={gestion.id} className="border-l-4 border-lex-primary pl-3 py-1">
                                        <div className="font-medium">{gestion.tribunal}</div>
                                        <div className="text-sm text-gray-600">{gestion.gestion}</div>
                                        <div className="text-xs text-gray-400">{gestion.hora}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
