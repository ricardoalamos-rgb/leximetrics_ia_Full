'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { AlertTriangle, FileCheck, CheckSquare, MapPin, Loader2 } from 'lucide-react';

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
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-lex-brand to-lex-vibrant-cyan bg-clip-text text-transparent">Mi Día Legal</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">Cargando tu resumen del día...</p>
                    </div>
                    <Loader2 className="w-8 h-8 animate-spin text-lex-vibrant-cyan" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 h-64"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-lex-brand to-lex-vibrant-cyan bg-clip-text text-transparent mb-6">Mi Día Legal</h1>
                <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-6 rounded-2xl shadow-medium">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6" />
                        <p className="font-semibold">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-lex-brand via-lex-primary to-lex-vibrant-cyan bg-clip-text text-transparent mb-3">Mi Día Legal</h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Resumen de tus prioridades para hoy.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Causas en Rojo */}
                {data?.causasEnRojo && data.causasEnRojo.length > 0 && (
                    <div className="group rounded-2xl bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-red-950/20 dark:via-slate-800 dark:to-orange-950/20 p-6 border-2 border-red-200 dark:border-red-800 shadow-medium hover:shadow-hard transition-all duration-300 hover:-translate-y-1 animate-scale-in">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-bold text-red-700 dark:text-red-400 flex items-center gap-3">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                                Causas en Rojo
                            </h2>
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                        <ul className="space-y-4">
                            {data.causasEnRojo.map((causa: any) => (
                                <li key={causa.id} className="border-b border-red-100 dark:border-red-900/50 last:border-0 pb-3 last:pb-0">
                                    <Link href={`/dashboard/causas/${causa.id}`} className="block hover:translate-x-1 transition-transform duration-200">
                                        <div className="font-semibold text-gray-900 dark:text-white hover:text-lex-vibrant-cyan dark:hover:text-lex-vibrant-cyan transition-colors">{causa.caratula}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{causa.rol} - {causa.tribunal}</div>
                                        <div className="text-xs text-red-600 dark:text-red-400 mt-2 font-semibold bg-red-100 dark:bg-red-900/30 inline-block px-2 py-1 rounded-md">
                                            {causa.riesgoInactividad === 'ROJO' ? '🚨 Inactividad Crítica' : '⚠️ Riesgo Procesal Alto'}
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-5 pt-4 border-t border-red-200 dark:border-red-800 text-right">
                            <Link href="/dashboard/causas-rojas" className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold hover:underline decoration-2 underline-offset-4 inline-flex items-center gap-2">
                                Ver todas
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                )}

                {/* Borradores Pendientes */}
                {data?.borradoresPendientes && (
                    <div className="group rounded-2xl bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-blue-950/20 dark:via-slate-800 dark:to-cyan-950/20 p-6 border-2 border-blue-200 dark:border-blue-800 shadow-medium hover:shadow-hard transition-all duration-300 hover:-translate-y-1 animate-scale-in" style={{ animationDelay: '100ms' }}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-bold text-lex-brand dark:text-blue-400">Borradores Listos</h2>
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <FileCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        {data.borradoresPendientes.length === 0 ? (
                            <p className="text-gray-400 dark:text-gray-500 italic text-center py-8">No hay borradores pendientes.</p>
                        ) : (
                            <ul className="space-y-3">
                                {data.borradoresPendientes.map((borrador: any, index: number) => (
                                    <li key={index} className="flex justify-between items-center p-3 bg-white dark:bg-slate-700/50 rounded-xl hover:shadow-md transition-shadow border border-blue-100 dark:border-blue-900">
                                        <span className="font-medium text-gray-800 dark:text-gray-200">{borrador.nombre || 'Documento sin nombre'}</span>
                                        <button className="text-xs bg-gradient-to-r from-lex-primary to-lex-vibrant-cyan text-white px-4 py-2 rounded-lg hover:scale-105 transition-transform font-semibold shadow-sm">
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
                    <div className="group rounded-2xl bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-purple-950/20 dark:via-slate-800 dark:to-pink-950/20 p-6 border-2 border-purple-200 dark:border-purple-800 shadow-medium hover:shadow-hard transition-all duration-300 hover:-translate-y-1 animate-scale-in" style={{ animationDelay: '200ms' }}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-bold text-purple-700 dark:text-purple-400">Tareas Operativas</h2>
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <CheckSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                        {data.tareasOperativas.length === 0 ? (
                            <p className="text-gray-400 dark:text-gray-500 italic text-center py-8">No hay tareas pendientes.</p>
                        ) : (
                            <ul className="space-y-3">
                                {data.tareasOperativas.map((tarea: any) => (
                                    <li key={tarea.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-700/50 rounded-xl hover:shadow-md transition-shadow border border-purple-100 dark:border-purple-900">
                                        <input type="checkbox" className="w-5 h-5 rounded border-2 border-purple-300 text-purple-600 focus:ring-purple-500 focus:ring-2 cursor-pointer" />
                                        <span className="text-gray-800 dark:text-gray-200 font-medium">{tarea.title}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* Gestiones Físicas */}
                {data?.gestionesFisicasHoy && (
                    <div className="group rounded-2xl bg-gradient-to-br from-amber-50 via-white to-yellow-50 dark:from-amber-950/20 dark:via-slate-800 dark:to-yellow-950/20 p-6 border-2 border-amber-200 dark:border-amber-800 shadow-medium hover:shadow-hard transition-all duration-300 hover:-translate-y-1 animate-scale-in" style={{ animationDelay: '300ms' }}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-bold text-amber-700 dark:text-amber-400">Gestiones en Terreno</h2>
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                        {data.gestionesFisicasHoy.length === 0 ? (
                            <p className="text-gray-400 dark:text-gray-500 italic text-center py-8">No hay gestiones físicas para hoy.</p>
                        ) : (
                            <ul className="space-y-3">
                                {data.gestionesFisicasHoy.map((gestion: any) => (
                                    <li key={gestion.id} className="border-l-4 border-amber-500 bg-white dark:bg-slate-700/50 pl-4 pr-3 py-3 rounded-r-xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="font-semibold text-gray-900 dark:text-white">{gestion.tribunal}</div>
                                        <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">{gestion.gestion}</div>
                                        <div className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-bold">🕐 {gestion.hora}</div>
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
