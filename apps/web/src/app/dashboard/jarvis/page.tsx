'use client';

import { useEffect, useState } from 'react';

interface SourceTelemetry {
    source_type: string;
    count: number;
    avg_relevance: number;
}

interface IndexingStatus {
    counts: Record<string, number>;
    indexing_progress: any;
}

interface ScrapersHealth {
    pjud: { ok: boolean; error?: string };
    bcn: { ok: boolean; error?: string };
    scielo: { ok: boolean; error?: string };
}

import { JarvisChat } from '@/components/jarvis/JarvisChat';

export default function JarvisDashboardPage() {
    const [data, setData] = useState<SourceTelemetry[]>([]);
    const [indexing, setIndexing] = useState<IndexingStatus | null>(null);
    const [scrapers, setScrapers] = useState<ScrapersHealth | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTelemetry = async () => {
            try {
                setLoading(true);
                const [resSources, resIndexing, resScrapers] = await Promise.all([
                    fetch('/api/jarvis/telemetry/sources'),
                    fetch('/api/jarvis/telemetry/indexing'),
                    fetch('/api/jarvis/telemetry/scrapers-health'),
                ]);

                const bodySources = await resSources.json();
                const bodyIndexing = await resIndexing.json();
                const bodyScrapers = await resScrapers.json();

                if (!resSources.ok) throw new Error(bodySources.error || 'Error sources');

                setData(bodySources as SourceTelemetry[]);
                setIndexing(bodyIndexing);
                setScrapers(bodyScrapers);
            } catch (err) {
                console.error('[JARVIS telemetry] error:', err);
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Ocurrió un error al cargar la telemetría de JARVIS.',
                );
            } finally {
                setLoading(false);
            }
        };

        fetchTelemetry();
    }, []);

    if (loading) {
        return <div>Cargando telemetría de JARVIS...</div>;
    }

    if (error) {
        return (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                Error: {error}
            </div>
        );
    }

    if (!data.length && !indexing && !scrapers) {
        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-bold text-lex-text">
                    J.A.R.V.I.S. – Telemetría de Fuentes
                </h1>
                <p className="text-gray-600">
                    Todavía no hay datos disponibles.
                </p>
            </div>
        );
    }

    const total = data.reduce((acc, d) => acc + d.count, 0);

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-lex-text">
                    J.A.R.V.I.S. – Telemetría y Salud
                </h1>
                <p className="text-gray-600 mt-1">
                    Estado de fuentes, indexación y scrapers externos.
                </p>
            </div>

            {/* Scrapers Health */}
            {scrapers && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-lg border ${scrapers.pjud.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-700">PJUD Scraper</span>
                            <span className="text-xl">{scrapers.pjud.ok ? '✅' : '❌'}</span>
                        </div>
                        {!scrapers.pjud.ok && <p className="text-xs text-red-600 mt-1">{scrapers.pjud.error}</p>}
                    </div>
                    <div className={`p-4 rounded-lg border ${scrapers.bcn.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-700">BCN Scraper</span>
                            <span className="text-xl">{scrapers.bcn.ok ? '✅' : '❌'}</span>
                        </div>
                        {!scrapers.bcn.ok && <p className="text-xs text-red-600 mt-1">{scrapers.bcn.error}</p>}
                    </div>
                    <div className={`p-4 rounded-lg border ${scrapers.scielo.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-700">SciELO Scraper</span>
                            <span className="text-xl">{scrapers.scielo.ok ? '✅' : '❌'}</span>
                        </div>
                        {!scrapers.scielo.ok && <p className="text-xs text-red-600 mt-1">{scrapers.scielo.error}</p>}
                    </div>
                </div>
            )}

            {/* Indexing Status */}
            {indexing && (
                <div className="bg-white rounded-lg border border-lex-border p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-lex-text mb-4">Estado de Indexación (RAG Local)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {Object.entries(indexing.counts).map(([key, count]) => (
                            <div key={key} className="bg-gray-50 p-3 rounded border border-gray-200 text-center">
                                <p className="text-xs text-gray-500 uppercase font-medium mb-1">{key.replace('_', ' ')}</p>
                                <p className="text-xl font-bold text-lex-primary">{count}</p>
                                <p className="text-[10px] text-gray-400">chunks</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Resumen general */}
            <div className="bg-white rounded-lg border border-lex-border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <p className="text-sm text-gray-500">Consultas totales registradas</p>
                    <p className="text-3xl font-bold text-lex-text">{total}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">
                        Fuente más utilizada (por conteo)
                    </p>
                    <p className="text-lg font-semibold text-lex-accent">
                        {data
                            .slice()
                            .sort((a, b) => b.count - a.count)[0]?.source_type || '-'}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">
                        Mejor relevancia promedio (↑)
                    </p>
                    <p className="text-lg font-semibold text-lex-success">
                        {data
                            .slice()
                            .sort((a, b) => b.avg_relevance - a.avg_relevance)[0]
                            ?.source_type || '-'}
                    </p>
                </div>
            </div>

            {/* Tabla detallada */}
            <div className="bg-white shadow-sm rounded-lg border border-lex-border overflow-hidden">
                <table className="min-w-full divide-y divide-lex-border">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fuente
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Consultas
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Relevancia Promedio
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Peso relativo
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-lex-border">
                        {data.map((row) => {
                            const percentage = total > 0 ? (row.count / total) * 100 : 0;
                            return (
                                <tr key={row.source_type}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-lex-text">
                                        {row.source_type}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                        {row.count}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                        {row.avg_relevance.toFixed(1)}%
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-700">
                                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="h-2 rounded-full bg-lex-accent"
                                                style={{ width: `${percentage.toFixed(1)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {percentage.toFixed(1)}% de las consultas
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <p className="text-xs text-gray-500">
                Datos originados desde J.A.R.V.I.S. 4.0 (FastAPI + SQLite
                de telemetría), usando el endpoint <code>/telemetry/sources</code>.
            </p>

            {/* Chat de Prueba */}
            <div className="bg-white rounded-lg border border-lex-border shadow-sm overflow-hidden h-[600px] flex flex-col">
                <div className="p-4 border-b border-lex-border bg-gray-50">
                    <h3 className="text-lg font-semibold text-lex-text">Probar J.A.R.V.I.S. + Feedback</h3>
                    <p className="text-sm text-gray-500">Haz una consulta y califica la respuesta para entrenar el modelo.</p>
                </div>
                <div className="flex-1 overflow-hidden">
                    <JarvisChat placeholder="Pregunta algo sobre derecho chileno..." />
                </div>
            </div>
        </div>
    );
}
