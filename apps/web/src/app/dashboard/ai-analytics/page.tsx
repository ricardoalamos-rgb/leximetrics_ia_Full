'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface AiFeatureMetrics {
    feature: string;
    requests: number;
    successRate: number;
    avgLatencyMs: number | null;
    totalTokens: number;
    totalCostUsd: number | null;
}

interface AiDailyMetric {
    date: string; // YYYY-MM-DD
    totalRequests: number;
}

interface AiOverviewResponse {
    from: string;
    to: string;
    totalRequests: number;
    totalTokens: number;
    totalCostUsd: number | null;
    avgLatencyMs: number | null;
    features: AiFeatureMetrics[];
    daily: AiDailyMetric[];
}

interface AiUserMetrics {
    userId: string;
    userName: string | null;
    requests: number;
    successRate: number;
    totalTokens: number;
    totalCostUsd: number | null;
}

interface AiUserOverviewResponse {
    from: string;
    to: string;
    totalRequests: number;
    totalTokens: number;
    totalCostUsd: number | null;
    users: AiUserMetrics[];
}

type RangePreset = '7d' | '30d' | '90d';

export default function AiAnalyticsPage() {
    const [range, setRange] = useState<RangePreset>('30d');
    const [overview, setOverview] = useState<AiOverviewResponse | null>(null);
    const [userOverview, setUserOverview] =
        useState<AiUserOverviewResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = async (preset: RangePreset) => {
        setLoading(true);
        setError(null);

        const now = new Date();
        const to = now.toISOString().slice(0, 10);

        const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;

        const fromDate = new Date(
            now.getTime() - days * 24 * 60 * 60 * 1000,
        )
            .toISOString()
            .slice(0, 10);

        try {
            const [ov, uov] = await Promise.all([
                apiClient.get<AiOverviewResponse>(
                    `/telemetry/overview?from=${fromDate}&to=${to}`,
                ),
                apiClient.get<AiUserOverviewResponse>(
                    `/telemetry/user-overview?from=${fromDate}&to=${to}`,
                ),
            ]);

            setOverview(ov);
            setUserOverview(uov);
        } catch (err: any) {
            console.error('Error cargando analíticas IA', err);
            setError(
                'No se pudo cargar la Telemetría de IA. Intenta nuevamente más tarde.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData(range);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [range]);

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-lex-text">
                        Analíticas de IA
                    </h1>
                    <p className="text-sm text-gray-500">
                        Uso de J.A.R.V.I.S., DocWorks y otros módulos de IA, agregado por
                        tenant y desglosado por usuario.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 mr-2">
                        Rango:
                    </span>
                    <button
                        onClick={() => setRange('7d')}
                        className={`px-3 py-1 text-xs rounded-full border ${range === '7d'
                                ? 'bg-lex-primary text-white border-lex-primary'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        7 días
                    </button>
                    <button
                        onClick={() => setRange('30d')}
                        className={`px-3 py-1 text-xs rounded-full border ${range === '30d'
                                ? 'bg-lex-primary text-white border-lex-primary'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        30 días
                    </button>
                    <button
                        onClick={() => setRange('90d')}
                        className={`px-3 py-1 text-xs rounded-full border ${range === '90d'
                                ? 'bg-lex-primary text-white border-lex-primary'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        90 días
                    </button>
                </div>
            </header>

            {loading && <div>Cargando analíticas de IA...</div>}

            {error && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                    {error}
                </div>
            )}

            {overview && !loading && (
                <>
                    {/* Resumen */}
                    <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white border border-lex-border rounded-xl p-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Requests IA
                            </h3>
                            <p className="mt-1 text-2xl font-bold text-lex-text">
                                {overview.totalRequests.toLocaleString('es-CL')}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                                En el rango seleccionado
                            </p>
                        </div>

                        <div className="bg-white border border-lex-border rounded-xl p-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Tokens (aprox.)
                            </h3>
                            <p className="mt-1 text-2xl font-bold text-lex-text">
                                {overview.totalTokens.toLocaleString('es-CL')}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                                Suma de tokens input + output
                            </p>
                        </div>

                        <div className="bg-white border border-lex-border rounded-xl p-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Costo estimado
                            </h3>
                            <p className="mt-1 text-2xl font-bold text-lex-text">
                                {overview.totalCostUsd != null
                                    ? `$${overview.totalCostUsd.toFixed(4)}`
                                    : 'N/D'}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                                Basado en precios configurados por modelo
                            </p>
                        </div>

                        <div className="bg-white border border-lex-border rounded-xl p-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Latencia Promedio
                            </h3>
                            <p className="mt-1 text-2xl font-bold text-lex-text">
                                {overview.avgLatencyMs != null
                                    ? `${overview.avgLatencyMs} ms`
                                    : 'N/D'}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                                Desde el frontend / servicios registrados
                            </p>
                        </div>
                    </section>

                    {/* Gráfico temporal */}
                    <section className="bg-white border border-lex-border rounded-xl p-4 h-80">
                        <h3 className="text-sm font-semibold text-lex-text mb-2">
                            Requests diarios de IA
                        </h3>
                        {overview.daily.length === 0 ? (
                            <p className="text-xs text-gray-500">
                                No hay datos en el rango seleccionado.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={overview.daily}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="totalRequests"
                                        stroke="#2563eb"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </section>

                    {/* Tabla por feature */}
                    <section className="bg-white border border-lex-border rounded-xl p-4 space-y-4">
                        <h3 className="text-sm font-semibold text-lex-text">
                            Uso por módulo de IA
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-xs">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500">
                                            Módulo
                                        </th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-500">
                                            Requests
                                        </th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-500">
                                            Éxito
                                        </th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-500">
                                            Latencia Prom.
                                        </th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-500">
                                            Tokens
                                        </th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-500">
                                            Costo (USD)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {overview.features.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-3 py-4 text-center text-gray-500"
                                            >
                                                No hay eventos registrados.
                                            </td>
                                        </tr>
                                    ) : (
                                        overview.features.map((f) => (
                                            <tr key={f.feature} className="border-t">
                                                <td className="px-3 py-2 text-left">
                                                    {f.feature === 'JARVIS_CHAT'
                                                        ? 'J.A.R.V.I.S.'
                                                        : f.feature === 'DOCWORKS_ANALYSIS'
                                                            ? 'DocWorks - Análisis'
                                                            : f.feature === 'DOCWORKS_GENERATION'
                                                                ? 'DocWorks - Generación'
                                                                : f.feature === 'SCRAPER_PJUD'
                                                                    ? 'Scraper PJUD'
                                                                    : f.feature}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    {f.requests.toLocaleString('es-CL')}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    {(f.successRate * 100).toFixed(1)}%
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    {f.avgLatencyMs != null
                                                        ? `${f.avgLatencyMs} ms`
                                                        : 'N/D'}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    {f.totalTokens.toLocaleString('es-CL')}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    {f.totalCostUsd != null
                                                        ? `$${f.totalCostUsd.toFixed(4)}`
                                                        : 'N/D'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Tabla por usuario */}
                    {userOverview && (
                        <section className="bg-white border border-lex-border rounded-xl p-4 space-y-4">
                            <h3 className="text-sm font-semibold text-lex-text">
                                Uso por usuario dentro del estudio
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-xs">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium text-gray-500">
                                                Usuario
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium text-gray-500">
                                                Requests
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium text-gray-500">
                                                Éxito
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium text-gray-500">
                                                Tokens
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium text-gray-500">
                                                Costo (USD)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userOverview.users.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="px-3 py-4 text-center text-gray-500"
                                                >
                                                    No hay usuarios con eventos de IA en el rango
                                                    seleccionado.
                                                </td>
                                            </tr>
                                        ) : (
                                            userOverview.users.map((u) => (
                                                <tr key={u.userId} className="border-t">
                                                    <td className="px-3 py-2 text-left">
                                                        {u.userName ?? 'Usuario anónimo'}
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        {u.requests.toLocaleString('es-CL')}
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        {(u.successRate * 100).toFixed(1)}%
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        {u.totalTokens.toLocaleString('es-CL')}
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        {u.totalCostUsd != null
                                                            ? `$${u.totalCostUsd.toFixed(4)}`
                                                            : 'N/D'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}
