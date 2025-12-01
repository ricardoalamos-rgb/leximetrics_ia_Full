'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Causa, EstadoCausa } from '@leximetrics/db';

interface DashboardCausa extends Omit<Causa, 'probabilidadExito'> {
    probabilidadExito?: number | null;
}

export default function CausasPage() {
    const [causas, setCausas] = useState<DashboardCausa[]>([]);
    const [filteredCausas, setFilteredCausas] = useState<DashboardCausa[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await apiClient.get<DashboardCausa[]>('/causas');
                setCausas(data);
                setFilteredCausas(data);
            } catch (err) {
                setError('Error al cargar las causas.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = causas.filter(c =>
            c.rol.toLowerCase().includes(lowerTerm) ||
            c.caratula.toLowerCase().includes(lowerTerm) ||
            c.tribunal.toLowerCase().includes(lowerTerm) ||
            (c.nombreDeudor && c.nombreDeudor.toLowerCase().includes(lowerTerm))
        );
        setFilteredCausas(filtered);
    }, [searchTerm, causas]);

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Buscador de Causas</h1>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-slate-800">
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Buscar por ROL, Carátula, Tribunal o Deudor..."
                        className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-lex-primary focus:outline-none focus:ring-1 focus:ring-lex-primary dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Rol / Tribunal</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Carátula / Deudor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Última Gestión</th>
                                    <th className="relative px-6 py-3"><span className="sr-only">Ver</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-800 dark:divide-gray-700">
                                {filteredCausas.map((causa) => (
                                    <tr key={causa.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{causa.rol}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{causa.tribunal}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 dark:text-white line-clamp-1">{causa.caratula}</div>
                                            {causa.nombreDeudor && <div className="text-xs text-gray-500 dark:text-gray-400">{causa.nombreDeudor}</div>}
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
                        {filteredCausas.length === 0 && (
                            <div className="p-4 text-center text-gray-500">No se encontraron causas.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
