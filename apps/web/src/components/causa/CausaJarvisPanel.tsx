'use client';

import React, { useState } from 'react';
import { apiClient } from '../../lib/api';

interface JarvisSource {
    source_type: string;
    score: number;
    document: string;
    metadata: Record<string, any>;
}

interface JarvisResponse {
    answer: string;
    sources: JarvisSource[];
    correlation_id: string;
}

interface Props {
    causaId: string;
}

export const CausaJarvisPanel: React.FC<Props> = ({ causaId }) => {
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<JarvisResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAsk = async () => {
        if (!question.trim()) return;
        try {
            setLoading(true);
            setError(null);
            setResponse(null);

            const data = await apiClient.post<JarvisResponse>('/jarvis/ask-causa', {
                question,
                causaId,
            });

            setResponse(data);
        } catch (err: any) {
            console.error(err);
            setError('Ocurrió un error al preguntar a JARVIS. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-white border border-lex-border rounded-lg p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-lex-text mb-2">JARVIS para esta causa</h2>
                <p className="text-xs text-gray-500 mb-3">
                    Haz preguntas específicas sobre esta causa (etapa procesal, próximas gestiones, riesgos, borradores de escritos, etc.).
                    JARVIS utilizará el contexto de la causa, gestiones y documentos.
                </p>
                <textarea
                    className="w-full border border-lex-border rounded-md text-sm p-2 focus:outline-none focus:ring-1 focus:ring-lex-accent focus:border-lex-accent resize-y min-h-[80px]"
                    placeholder="Ej: ¿Qué estrategia recomiendas para acelerar la tramitación de esta causa?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                />
                <div className="mt-2 flex justify-end">
                    <button
                        type="button"
                        onClick={handleAsk}
                        disabled={loading || !question.trim()}
                        className="inline-flex items-center px-4 py-1.5 rounded-md text-sm font-medium bg-lex-accent text-white hover:bg-lex-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Preguntando…' : 'Preguntar a JARVIS'}
                    </button>
                </div>
                {error && (
                    <div className="mt-2 p-2 rounded bg-red-50 border border-red-200 text-xs text-red-700">
                        {error}
                    </div>
                )}
            </div>

            {response && (
                <div className="space-y-3">
                    <div className="bg-white border border-lex-border rounded-lg p-4 shadow-sm">
                        <h3 className="text-sm font-semibold text-lex-text mb-2">Respuesta</h3>
                        <p className="text-sm text-gray-800 whitespace-pre-line">
                            {response.answer}
                        </p>
                    </div>
                    <div className="bg-white border border-lex-border rounded-lg p-4 shadow-sm">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            Fuentes utilizadas
                        </h4>
                        {response.sources.length === 0 ? (
                            <p className="text-xs text-gray-500">
                                JARVIS no encontró fuentes relevantes para esta respuesta.
                            </p>
                        ) : (
                            <ul className="space-y-2 text-xs">
                                {response.sources.map((s, idx) => (
                                    <li key={idx} className="border border-gray-100 rounded-md p-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold text-lex-text">
                                                {s.source_type}
                                            </span>
                                            <span className="text-[10px] text-gray-500">
                                                score: {s.score.toFixed(3)}
                                            </span>
                                        </div>
                                        <p className="text-gray-700 line-clamp-3">
                                            {s.document}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <p className="mt-2 text-[10px] text-gray-400">
                            correlation_id: {response.correlation_id}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
