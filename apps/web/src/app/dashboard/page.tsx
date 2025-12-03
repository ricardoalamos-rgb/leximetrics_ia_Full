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
            <section className="relative rounded-3xl bg-gradient-to-r from-lex-brand via-lex-brand-light to-lex-vibrant-cyan p-10 text-white shadow-2xl overflow-hidden animate-fade-in">
                {/* Background Decorations */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-lex-vibrant-green/20 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-lex-gold/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>

                <div className="relative z-10">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-4xl font-extrabold mb-3 tracking-tight">¡Bienvenido de vuelta! 👋</h1>
                            <p className="text-lg text-blue-100 font-medium max-w-2xl">
                                Este es tu panel de control IA. Gestiona causas, genera documentos y mantén todo bajo control.
                            </p>
                        </div>
                        <div className="hidden lg:block">
                            <div className="glass-strong rounded-2xl px-6 py-3 border border-white/30">
                                <p className="text-sm font-semibold text-white/90">Sistema Activo</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-2 h-2 bg-lex-vibrant-green rounded-full animate-pulse"></div>
                                    <span className="text-xs text-white/80">Online</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-4">
                        <Link
                            href="/dashboard/causas"
                            className="group rounded-xl glass px-6 py-3 font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-xl border border-white/30"
                        >
                            <span className="flex items-center gap-2">
                                Buscar una causa
                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </span>
                        </Link>
                        <Link
                            href="/dashboard/jarvis"
                            className="rounded-xl bg-white px-6 py-3 font-semibold text-lex-brand transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-lex-vibrant-cyan hover:text-white"
                        >
                            Hablar con J.A.R.V.I.S.
                        </Link>
                        <Link
                            href="/dashboard/docworks"
                            className="group rounded-xl glass px-6 py-3 font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-xl border border-white/30"
                        >
                            <span className="flex items-center gap-2">
                                Generar documento
                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </span>
                        </Link>
                    </div>
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
                <div className="rounded-2xl border-2 border-white/50 dark:border-gray-700 bg-gradient-to-br from-white via-blue-50/30 to-white dark:from-slate-800 dark:to-slate-800 p-8 shadow-medium hover:shadow-hard transition-all duration-300 lg:col-span-1 animate-slide-right">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-lex-brand to-lex-vibrant-cyan bg-clip-text text-transparent mb-6">Distribución por Estado</h3>
                    <div className="space-y-4">
                        {sortedEstados.map(([estado, count]) => (
                            <div key={estado} className="group">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{estado}</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{count}</span>
                                </div>
                                <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                    <div
                                        className={`h-3 rounded-full ${getEstadoColor(estado)} transition-all duration-700 group-hover:shadow-lg`}
                                        style={{ width: `${(count / maxCount) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Causes Table */}
                <div className="rounded-2xl border-2 border-white/50 dark:border-gray-700 bg-white dark:bg-slate-800 shadow-medium hover:shadow-hard transition-all duration-300 lg:col-span-2 overflow-hidden animate-slide-left">
                    <div className="border-b-2 border-gray-100 dark:border-gray-700 px-8 py-5 bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-lex-brand to-lex-vibrant-cyan bg-clip-text text-transparent">Causas Recientes</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gradient-to-r from-gray-50 to-blue-50/20 dark:from-gray-900/50 dark:to-slate-800">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Rol / Tribunal</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Carátula</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Última Gestión</th>
                                    <th className="relative px-6 py-4"><span className="sr-only">Ver</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100 dark:bg-slate-800 dark:divide-gray-700">
                                {causas.slice(0, 5).map((causa) => (
                                    <tr key={causa.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-cyan-50/30 dark:hover:from-gray-700/30 dark:hover:to-gray-700/50 transition-all duration-200">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{causa.rol}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{causa.tribunal}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 dark:text-white font-medium line-clamp-1">{causa.caratula}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getEstadoColor(causa.estado).replace('bg-', 'bg-opacity-20 text-').replace('500', '800').replace('600', '800').replace('400', '800')} border-2 ${getEstadoColor(causa.estado).replace('bg-', 'border-').replace('500', '300').replace('600', '300').replace('400', '300')}`}>
                                                {causa.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 font-medium">
                                            {causa.ultimaGestion ? new Date(causa.ultimaGestion).toLocaleDateString('es-CL') : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                                            <Link href={`/dashboard/causas/${causa.id}`} className="text-lex-primary hover:text-lex-vibrant-cyan dark:text-lex-vibrant-cyan dark:hover:text-lex-vibrant-green transition-colors hover:underline decoration-2 underline-offset-4">
                                                Ver detalle →
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-900/50 dark:to-slate-800 px-8 py-4 border-t-2 border-gray-100 dark:border-gray-700 text-right">
                        <Link href="/dashboard/causas" className="inline-flex items-center gap-2 text-sm font-bold text-lex-primary hover:text-lex-vibrant-cyan dark:text-lex-vibrant-cyan dark:hover:text-lex-vibrant-green transition-colors">
                            Ver todas las causas
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
