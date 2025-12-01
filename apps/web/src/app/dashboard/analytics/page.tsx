'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api';
import { UsageOverview, UsageSummary } from '../../../components/analytics/UsageOverview';

const AnalyticsPage: React.FC = () => {
    const [data, setData] = useState<UsageSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [from, setFrom] = useState<string | null>(null);
    const [to, setTo] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const params = new URLSearchParams();
                if (from) params.append('from', from);
                if (to) params.append('to', to);

                const query = `/telemetry/usage-summary${params.toString() ? `?${params.toString()}` : ''}`;
                const result = await apiClient.get<UsageSummary>(query);
                setData(result);
            } catch (err: any) {
                console.error(err);
                setError('No se pudo cargar la telemetría de IA. Verifica que el backend esté corriendo.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [from, to]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-lex-text">Telemetría IA</h1>
                    <p className="text-sm text-gray-500">
                        Tokens y costo de IA por usuario, feature y día (según uso real de GPT/JARVIS).
                    </p>
                </div>
                <div className="flex gap-2">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Desde</label>
                        <input
                            type="date"
                            className="border border-lex-border rounded px-2 py-1 text-sm"
                            value={from ?? ''}
                            onChange={(e) => setFrom(e.target.value || null)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                        <input
                            type="date"
                            className="border border-lex-border rounded px-2 py-1 text-sm"
                            value={to ?? ''}
                            onChange={(e) => setTo(e.target.value || null)}
                        />
                    </div>
                </div>
            </div>

            {loading && <div>Cargando métricas de IA...</div>}

            {error && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                    {error}
                </div>
            )}

            {!loading && !error && data && <UsageOverview data={data} />}
        </div>
    );
};

export default AnalyticsPage;
