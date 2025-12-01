'use client';

import React from 'react';

export interface UsageSummary {
    from: string;
    to: string;
    totalTokens: number;
    totalCostUsd: number;
    byUser: { userId: string | null; totalTokens: number; totalCostUsd: number }[];
    byFeature: { feature: string; totalTokens: number; totalCostUsd: number }[];
    daily: { date: string; totalTokens: number; totalCostUsd: number }[];
}

interface Props {
    data: UsageSummary;
}

export const UsageOverview: React.FC<Props> = ({ data }) => {
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 4,
        }).format(value);

    return (
        <div className="space-y-8">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-4 border border-lex-border">
                    <h3 className="text-sm font-medium text-gray-500">Tokens Totales</h3>
                    <p className="mt-2 text-2xl font-bold text-lex-text">{data.totalTokens.toLocaleString('es-CL')}</p>
                    <p className="mt-1 text-xs text-gray-400">
                        Desde {new Date(data.from).toLocaleDateString('es-CL')} hasta{' '}
                        {new Date(data.to).toLocaleDateString('es-CL')}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 border border-lex-border">
                    <h3 className="text-sm font-medium text-gray-500">Costo Total IA</h3>
                    <p className="mt-2 text-2xl font-bold text-lex-text">{formatCurrency(data.totalCostUsd)}</p>
                    <p className="mt-1 text-xs text-gray-400">Estimado por uso real de tokens</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 border border-lex-border">
                    <h3 className="text-sm font-medium text-gray-500">Días con Actividad</h3>
                    <p className="mt-2 text-2xl font-bold text-lex-text">{data.daily.length}</p>
                    <p className="mt-1 text-xs text-gray-400">Serie de tiempo por día</p>
                </div>
            </div>

            {/* Uso por usuario */}
            <div className="bg-white rounded-lg shadow p-4 border border-lex-border">
                <h3 className="text-lg font-semibold text-lex-text mb-4">Uso por Usuario</h3>
                <table className="min-w-full divide-y divide-lex-border">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tokens</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Costo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-lex-border">
                        {data.byUser.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-4 text-sm text-gray-500 text-center">
                                    No hay datos de uso IA aún.
                                </td>
                            </tr>
                        ) : (
                            data.byUser.map((u) => (
                                <tr key={u.userId ?? 'SIN_USUARIO'}>
                                    <td className="px-4 py-2 text-sm text-lex-text">{u.userId ?? 'Sin usuario asociado'}</td>
                                    <td className="px-4 py-2 text-sm text-gray-700">
                                        {u.totalTokens.toLocaleString('es-CL')}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-700">{formatCurrency(u.totalCostUsd)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Uso por feature */}
            <div className="bg-white rounded-lg shadow p-4 border border-lex-border">
                <h3 className="text-lg font-semibold text-lex-text mb-4">Uso por Feature</h3>
                <table className="min-w-full divide-y divide-lex-border">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Feature</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tokens</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Costo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-lex-border">
                        {data.byFeature.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-4 text-sm text-gray-500 text-center">
                                    No hay datos de uso IA aún.
                                </td>
                            </tr>
                        ) : (
                            data.byFeature.map((f) => (
                                <tr key={f.feature}>
                                    <td className="px-4 py-2 text-sm text-lex-text">{f.feature}</td>
                                    <td className="px-4 py-2 text-sm text-gray-700">
                                        {f.totalTokens.toLocaleString('es-CL')}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-700">{formatCurrency(f.totalCostUsd)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
