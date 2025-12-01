'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface FeatureUsage {
    feature: string;
    calls: number;
    tokensInput: number;
    tokensOutput: number;
    costUsd: number;
}

export default function AnalyticsUserPage() {
    const [data, setData] = useState<FeatureUsage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await apiClient.get<FeatureUsage[]>('/ai-telemetry/user-summary?days=7');
                setData(res || []);
            } catch (err) {
                console.error('[Analytics Me] Error:', err);
                setError(err instanceof Error ? err.message : 'Error cargando telemetría personal.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando mi consumo de IA...</div>;
    if (error) {
        return (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                Error: {error}
            </div>
        );
    }

    const totalCost = data.reduce((acc, d) => acc + d.costUsd, 0);
    const totalCalls = data.reduce((acc, d) => acc + d.calls, 0);
    const totalTokens = data.reduce((acc, d) => acc + d.tokensInput + d.tokensOutput, 0);

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-lex-text">Mi Consumo de IA</h1>
                <p className="text-gray-600 text-sm">
                    Uso personal de funcionalidades IA (últimos 7 días).
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 border border-lex-border rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Mis Llamadas</p>
                    <p className="text-3xl font-bold text-lex-text mt-2">{totalCalls}</p>
                </div>
                <div className="bg-white p-6 border border-lex-border rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Mis Tokens</p>
                    <p className="text-3xl font-bold text-lex-text mt-2">
                        {totalTokens.toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-6 border border-lex-border rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Mi Costo (USD)</p>
                    <p className="text-3xl font-bold text-lex-text mt-2">
                        ${totalCost.toFixed(4)}
                    </p>
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg border border-lex-border overflow-hidden">
                <table className="min-w-full divide-y divide-lex-border">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Llamadas</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens In</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens Out</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo USD</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-lex-border">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No has utilizado funcionalidades de IA en los últimos 7 días.
                                </td>
                            </tr>
                        ) : (
                            data.map((row) => (
                                <tr key={row.feature} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-lex-text">{row.feature}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{row.calls}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{row.tokensInput.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{row.tokensOutput.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                                        ${row.costUsd.toFixed(4)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
