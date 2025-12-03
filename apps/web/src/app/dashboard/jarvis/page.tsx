'use client';

import { useEffect, useState } from 'react';
import { JarvisChat } from '@/components/jarvis/JarvisChat';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Activity, Database, Server, MessageSquare, BarChart3, CheckCircle2, XCircle } from 'lucide-react';

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
                    apiClient.get<SourceTelemetry[]>('/jarvis/telemetry/sources'),
                    apiClient.get<IndexingStatus>('/jarvis/telemetry/indexing'),
                    apiClient.get<ScrapersHealth>('/jarvis/telemetry/scrapers-health'),
                ]);

                setData(resSources);
                setIndexing(resIndexing);
                setScrapers(resScrapers);
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
        return (
            <div className="flex h-[50vh] items-center justify-center flex-col gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-lex-brand" />
                <span className="text-lex-brand font-medium animate-pulse">Conectando con J.A.R.V.I.S...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="rounded-xl bg-red-50 p-6 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900 shadow-sm">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                        <XCircle className="w-5 h-5" />
                        Error de Conexión
                    </h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    const total = data.reduce((acc, d) => acc + d.count, 0);

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col animate-fade-in pb-4">
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-extrabold bg-gradient-to-r from-lex-brand to-purple-600 bg-clip-text text-transparent">
                        J.A.R.V.I.S.
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Asistente Legal Inteligente
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
                {/* Left Column: Chat (Primary Focus) */}
                <div className="lg:col-span-8 flex flex-col min-h-0">
                    <Card className="flex-1 flex flex-col overflow-hidden border-lex-brand/20 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 border-b border-gray-100 dark:border-gray-700 py-3 px-4 shrink-0">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MessageSquare className="w-4 h-4 text-lex-brand" />
                                Chat con J.A.R.V.I.S.
                            </CardTitle>
                        </CardHeader>
                        <div className="flex-1 overflow-hidden">
                            <JarvisChat placeholder="Pregunta sobre tus causas, leyes o redacción de escritos..." />
                        </div>
                    </Card>
                </div>

                {/* Right Column: Stats & Telemetry (Compact) */}
                <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1">
                    {/* Compact Scrapers Health */}
                    {scrapers && (
                        <div className="grid grid-cols-3 gap-2">
                            <Card className={`border-l-2 ${scrapers.pjud.ok ? 'border-l-green-500' : 'border-l-red-500'} shadow-sm`}>
                                <div className="p-2 flex flex-col items-center justify-center text-center">
                                    <Server className={`w-4 h-4 mb-1 ${scrapers.pjud.ok ? 'text-green-600' : 'text-red-600'}`} />
                                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">PJUD</span>
                                </div>
                            </Card>
                            <Card className={`border-l-2 ${scrapers.bcn.ok ? 'border-l-green-500' : 'border-l-red-500'} shadow-sm`}>
                                <div className="p-2 flex flex-col items-center justify-center text-center">
                                    <Database className={`w-4 h-4 mb-1 ${scrapers.bcn.ok ? 'text-green-600' : 'text-red-600'}`} />
                                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">BCN</span>
                                </div>
                            </Card>
                            <Card className={`border-l-2 ${scrapers.scielo.ok ? 'border-l-green-500' : 'border-l-red-500'} shadow-sm`}>
                                <div className="p-2 flex flex-col items-center justify-center text-center">
                                    <Activity className={`w-4 h-4 mb-1 ${scrapers.scielo.ok ? 'text-green-600' : 'text-red-600'}`} />
                                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">SciELO</span>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Compact Metrics */}
                    <Card className="shadow-sm">
                        <CardHeader className="py-3 px-4 border-b border-gray-100 dark:border-gray-800">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-lex-brand" />
                                Métricas Rápidas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-800 border-b border-gray-100 dark:border-gray-800">
                                <div className="p-3 text-center">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Consultas</p>
                                    <p className="text-xl font-bold text-lex-brand">{total}</p>
                                </div>
                                <div className="p-3 text-center">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Relevancia</p>
                                    <p className="text-xl font-bold text-green-600">
                                        {data.length > 0 ? (data.reduce((acc, curr) => acc + curr.avg_relevance, 0) / data.length).toFixed(0) : 0}%
                                    </p>
                                </div>
                            </div>
                            {indexing && (
                                <div className="p-3 bg-gray-50 dark:bg-slate-800/50">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Indexación RAG</span>
                                        <span className="text-xs font-bold text-lex-brand">{indexing.indexing_progress ?? 0}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-lex-brand rounded-full"
                                            style={{ width: `${indexing.indexing_progress ?? 0}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Compact Source Table */}
                    <Card className="flex-1 shadow-sm flex flex-col min-h-0">
                        <CardHeader className="py-3 px-4 border-b border-gray-100 dark:border-gray-800">
                            <CardTitle className="text-sm">Fuentes de Conocimiento</CardTitle>
                        </CardHeader>
                        <div className="overflow-y-auto flex-1 p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="h-8 text-xs">Fuente</TableHead>
                                        <TableHead className="h-8 text-xs text-right">Uso</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((row) => (
                                        <TableRow key={row.source_type} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                            <TableCell className="py-2 text-xs font-medium">
                                                {row.source_type}
                                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1 mt-1">
                                                    <div
                                                        className={`h-full rounded-full ${row.avg_relevance > 80 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                                        style={{ width: `${row.avg_relevance}%` }}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2 text-xs text-right">
                                                {row.count}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
