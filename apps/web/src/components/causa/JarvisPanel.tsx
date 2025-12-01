'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';

type JarvisModo = 'resumen_causa' | 'proximos_pasos' | 'explicar_riesgo' | 'preparar_briefing';

interface JarvisResponse {
    modo: string;
    resultado: any;
    limitaciones: string[];
}

interface JarvisPanelProps {
    causaId: string;
}

// Misma lógica que DocWorks para resolver la URL del AI Service
const getAIServiceURL = () => {
    if (process.env.NEXT_PUBLIC_AI_SERVICE_URL) {
        return process.env.NEXT_PUBLIC_AI_SERVICE_URL;
    }
    if (typeof window !== 'undefined') {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:8000';
        }
    }
    return '/ai';
};

const AI_SERVICE_URL = getAIServiceURL();

export const JarvisPanel = ({ causaId }: JarvisPanelProps) => {
    const [modo, setModo] = useState<JarvisModo>('resumen_causa');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<JarvisResponse | null>(null);

    const handleAskJarvis = async () => {
        setLoading(true);
        setError(null);
        setResponse(null);
        try {
            // 1. Obtener CaseContext desde el backend
            const context = await apiClient.get<any>(`/case-context/${causaId}`);

            // 2. Llamar al AI Service
            const res = await fetch(`${AI_SERVICE_URL}/jarvis/causa-360`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ modo, context }),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => res.statusText);
                throw new Error(`Error J.A.R.V.I.S.: ${text}`);
            }

            const data: JarvisResponse = await res.json();
            setResponse(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido al consultar J.A.R.V.I.S.');
        } finally {
            setLoading(false);
        }
    };

    const renderResultado = () => {
        if (!response) return null;
        return (
            <div className="mt-4 space-y-3">
                <pre className="text-xs bg-gray-50 border border-lex-border rounded p-3 whitespace-pre-wrap break-words">
                    {JSON.stringify(response.resultado, null, 2)}
                </pre>
                {response.limitaciones?.length > 0 && (
                    <div className="mt-2">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Limitaciones detectadas:</p>
                        <ul className="list-disc list-inside text-xs text-gray-500">
                            {response.limitaciones.map((l, idx) => (
                                <li key={idx}>{l}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    return (
        <aside className="w-full lg:w-96 lg:border-l lg:border-lex-border lg:pl-4 mt-6 lg:mt-0">
            <div className="bg-white border border-lex-border rounded-lg shadow-sm p-4 h-full flex flex-col">
                <h2 className="text-lg font-semibold text-lex-text mb-2">J.A.R.V.I.S. – Copiloto Causa 360°</h2>
                <p className="text-xs text-gray-500 mb-3">
                    Analiza la causa completa y sugiere resúmenes, próximos pasos y riesgos.
                </p>

                <div className="flex flex-wrap gap-2 mb-3">
                    {[
                        { id: 'resumen_causa', label: 'Resumen' },
                        { id: 'proximos_pasos', label: 'Próximos pasos' },
                        { id: 'explicar_riesgo', label: 'Riesgo' },
                        { id: 'preparar_briefing', label: 'Briefing' },
                    ].map((m) => (
                        <button
                            key={m.id}
                            type="button"
                            onClick={() => setModo(m.id as JarvisModo)}
                            className={`text-xs px-3 py-1 rounded-full border ${modo === m.id
                                    ? 'bg-lex-primary text-white border-lex-primary'
                                    : 'bg-white text-gray-600 border-lex-border hover:bg-gray-50'
                                }`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={handleAskJarvis}
                    disabled={loading}
                    className="w-full text-sm font-medium bg-lex-accent text-white rounded-md py-2 hover:bg-lex-accent/90 disabled:opacity-50"
                >
                    {loading ? 'Consultando a J.A.R.V.I.S…' : 'Preguntar a J.A.R.V.I.S.'}
                </button>

                {error && (
                    <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
                        {error}
                    </div>
                )}

                {renderResultado()}
            </div>
        </aside>
    );
};
