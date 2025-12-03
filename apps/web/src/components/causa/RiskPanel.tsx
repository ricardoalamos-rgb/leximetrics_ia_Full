'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { RiskBadge } from './RiskBadge';

interface RiskData {
    score: number;
    label: 'BAJO' | 'MEDIO' | 'ALTO';
    reasons: string[];
}

interface RiskPanelProps {
    causaId: string;
}

export function RiskPanel({ causaId }: RiskPanelProps) {
    const [riskData, setRiskData] = useState<RiskData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRisk = async () => {
            try {
                setLoading(true);
                const data = await apiClient.get<RiskData>(`/causas/${causaId}/riesgo`);
                setRiskData(data);
            } catch (err) {
                console.error('Error fetching risk data:', err);
                setError('No se pudo cargar el análisis de riesgo.');
            } finally {
                setLoading(false);
            }
        };

        fetchRisk();
    }, [causaId]);

    if (loading) {
        return <div className="animate-pulse h-20 bg-gray-100 rounded-lg dark:bg-slate-800"></div>;
    }

    if (error) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                {error}
            </div>
        );
    }

    if (!riskData) return null;

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Análisis de Riesgo</h3>
                <RiskBadge score={riskData.score} label={riskData.label} />
            </div>

            <ul className="space-y-2 mb-4">
                {riskData.reasons.map((reason, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-lex-primary"></span>
                        {reason}
                    </li>
                ))}
            </ul>

            <button
                onClick={() => {
                    // Navegar a la pestaña de Jarvis o abrir modal
                    const jarvisTab = document.getElementById('jarvis-tab-trigger');
                    if (jarvisTab) {
                        jarvisTab.click();
                    } else {
                        window.location.href = `/dashboard/jarvis?context=risk_mitigation&causaId=${causaId}`;
                    }
                }}
                className="w-full rounded-md bg-lex-primary/10 px-4 py-2 text-sm font-medium text-lex-primary hover:bg-lex-primary/20 transition-colors"
            >
                ✨ Pide a J.A.R.V.I.S. un plan para bajar el riesgo
            </button>
        </div>
    );
}
