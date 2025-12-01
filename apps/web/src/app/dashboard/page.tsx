'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Causa, EstadoCausa } from '@leximetrics/db';
import { StatsCards } from '@/components/dashboard/StatsCards';

// Inline type definition as requested, extending Causa with calculated fields if needed
// For the table, we use the raw Causa type mostly, but we might need extra fields for logic.
// The prompt asks to use specific fields: id, snumcaso, nombreDeudor, rol, tribunal, estado, ultimaGestion, probabilidadExito.
interface DashboardCausa extends Omit<Causa, 'probabilidadExito'> {
    probabilidadExito?: number | null; // Mock field for now if not in DB
}

export default function DashboardPage() {
    const [causas, setCausas] = useState<DashboardCausa[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiClient.get<DashboardCausa[]>('/causas');
            setCausas(data);
        } catch (err) {
            setError('Error al cargar las causas. Por favor, intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Metrics Calculation
    const totalCausas = causas.length;
    const altoRiesgo = causas.filter((c) => {
        // Heuristic: SIN_DEMANDA, SIN_NOTIFICAR, ETAPA_REMATE and no recent management (mock logic for "recent")
        // For simplicity based on prompt: "estado en SIN_DEMANDA, SIN_NOTIFICAR o ETAPA_REMATE y sin ultimaGestion reciente"
        const criticalStates: EstadoCausa[] = [
            EstadoCausa.SIN_DEMANDA,
            EstadoCausa.SIN_NOTIFICAR,
            EstadoCausa.ETAPA_REMATE,
        ];
        // Mock "recent" as within last 30 days. If ultimaGestion is null, it's not recent.
        const isRecent = c.ultimaGestion
            ? new Date(c.ultimaGestion).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
            : false;

        return criticalStates.includes(c.estado) && !isRecent;
    }).length;

    const rematesProximos = 0; // Placeholder
    const pendientesIA = causas.filter((c) => c.probabilidadExito === undefined || c.probabilidadExito === null).length;

    // Chart Data Preparation
    const estadoCounts = causas.reduce((acc, curr) => {
        acc[curr.estado] = (acc[curr.estado] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const sortedEstados = Object.entries(estadoCounts).sort((a, b) => b[1] - a[1]);
    const maxCount = Math.max(...Object.values(estadoCounts), 1);

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case EstadoCausa.PREJUDICIAL: return 'bg-yellow-500';
            case EstadoCausa.TRAMITACION: return 'bg-blue-500';
            case EstadoCausa.SENTENCIA: return 'bg-purple-500';
            case EstadoCausa.ARCHIVADA: return 'bg-gray-500';
            case EstadoCausa.SUSPENDIDA: return 'bg-red-500';
            case EstadoCausa.SIN_DEMANDA: return 'bg-orange-500';
            case EstadoCausa.SIN_NOTIFICAR: return 'bg-orange-400';
            case EstadoCausa.NOTIFICADO: return 'bg-indigo-500';
            case EstadoCausa.EMBARGADO: return 'bg-pink-500';
            case EstadoCausa.ETAPA_REMATE: return 'bg-red-600';
            case EstadoCausa.TERMINADA: return 'bg-green-500';
            default: return 'bg-gray-400';
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg dark:bg-gray-700"></div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-lg dark:bg-gray-700"></div>)}
                </div>
                <div className="h-64 bg-gray-200 rounded-lg dark:bg-gray-700"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <div className="flex">
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error de carga</h3>
                        <div className="mt-2 text-sm text-red-700">
                            <p>{error}</p>
                        </div>
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={fetchData}
                                className="rounded-md bg-red-100 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                                Reintentar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <section className="rounded-2xl bg-gradient-to-r from-lex-primary to-lex-accent p-8 text-white shadow-lg">
                <h1 className="text-3xl font-bold">Bienvenida de vuelta 👋</h1>
                <p className="mt-2 text-lg text-blue-100">
                    Este es tu panel de control IA. ¿Qué quieres lograr hoy?
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                    <Link
                        href="/dashboard/causas"
                        className="rounded-lg bg-white/20 px-4 py-2 font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                    >
                        Buscar una causa
                    </Link>
                    <Link
                        href="/dashboard/jarvis"
                        className="rounded-lg bg-white px-4 py-2 font-medium text-lex-primary transition-colors hover:bg-blue-50"
                    >
                        Hablar con J.A.R.V.I.S.
                    </Link>
                    <Link
                        href="/dashboard/docworks"
                        className="rounded-lg bg-white/20 px-4 py-2 font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                    >
                        Generar documento (DocWorks)
                    </Link>
                </div>
            </section>

            {/* Stats Cards */}
            <StatsCards
                totalCausas={totalCausas}
                altoRiesgo={altoRiesgo}
                rematesProximos={rematesProximos}
                pendientesIA={pendientesIA}
            />

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Distribution Chart */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-slate-800 lg:col-span-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Distribución por Estado</h3>
                    <div className="space-y-3">
                        {sortedEstados.map(([estado, count]) => (
                            <div key={estado}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600 dark:text-gray-300">{estado}</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{count}</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                                    <div
                                        className={`h-2 rounded-full ${getEstadoColor(estado)}`}
                                        style={{ width: `${(count / maxCount) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Causes Table */}
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-slate-800 lg:col-span-2 overflow-hidden">
                    <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Causas Recientes</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Rol / Tribunal</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Carátula</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Última Gestión</th>
                                    <th className="relative px-6 py-3"><span className="sr-only">Ver</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-800 dark:divide-gray-700">
                                {causas.slice(0, 5).map((causa) => (
                                    <tr key={causa.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{causa.rol}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{causa.tribunal}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 dark:text-white line-clamp-1">{causa.caratula}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getEstadoColor(causa.estado).replace('bg-', 'bg-opacity-20 text-').replace('500', '800').replace('600', '800').replace('400', '800')}`}>
                                                {causa.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {causa.ultimaGestion ? new Date(causa.ultimaGestion).toLocaleDateString('es-CL') : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link href={`/dashboard/causas/${causa.id}`} className="text-lex-primary hover:text-lex-accent">
                                                Ver detalle
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 dark:bg-gray-900/50 dark:border-gray-700 text-right">
                        <Link href="/dashboard/causas" className="text-sm font-medium text-lex-primary hover:text-lex-accent">
                            Ver todas las causas &rarr;
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
