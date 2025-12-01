"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";

interface CausaRiskSummary {
    id: string;
    snumcaso: string;
    rol: string;
    nombreDeudor?: string;
    estado: string;
    diasSinGestion: number;
    riesgoInactividad: "VERDE" | "AMARILLO" | "ROJO";
    riesgoProcesal: "BAJO" | "MEDIO" | "ALTO";
    fechaProximoRemate?: string;
}

export default function CausasRojasPage() {
    const [causas, setCausas] = useState<CausaRiskSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchCausasRojas = async () => {
            try {
                const data = await apiClient.get<CausaRiskSummary[]>("/risk/causas-rojas");
                setCausas(data);
            } catch (err: any) {
                setError(err.message || "Error al cargar causas en riesgo");
            } finally {
                setLoading(false);
            }
        };

        fetchCausasRojas();
    }, []);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
                <span className="ml-3 text-red-600">Analizando riesgos...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                <h3 className="font-medium">Error</h3>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-red-600 dark:text-red-500">Causas en Rojo</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Atención prioritaria: {causas.length} causas requieren gestión inmediata.
                    </p>
                </div>
            </div>

            {causas.length === 0 ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center dark:border-green-900/30 dark:bg-green-900/10">
                    <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-green-800 dark:text-green-400">¡Todo bajo control!</h3>
                    <p className="text-green-600 dark:text-green-500">No hay causas con riesgo crítico en este momento.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-slate-800">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Rol / Tribunal</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Deudor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Inactividad</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Riesgo Proc.</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-slate-800">
                            {causas.map((causa) => (
                                <tr key={causa.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{causa.rol}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{causa.snumcaso}</div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="text-sm text-gray-900 dark:text-white">{causa.nombreDeudor || "N/A"}</div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="flex items-center">
                                            <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${causa.riesgoInactividad === 'ROJO' ? 'bg-red-500' :
                                                    causa.riesgoInactividad === 'AMARILLO' ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}></span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">{causa.diasSinGestion} días</span>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${causa.riesgoProcesal === 'ALTO' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                                causa.riesgoProcesal === 'MEDIO' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                            }`}>
                                            {causa.riesgoProcesal}
                                        </span>
                                        {causa.fechaProximoRemate && (
                                            <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                                                Remate: {new Date(causa.fechaProximoRemate).toLocaleDateString()}
                                            </div>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                                        <Link href={`/dashboard/causas/${causa.id}`} className="text-lex-primary hover:text-lex-accent">
                                            Ver Detalle
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
