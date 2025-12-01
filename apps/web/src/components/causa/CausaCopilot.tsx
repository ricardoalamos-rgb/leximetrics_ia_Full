'use client';

import React, { useState, useRef, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Causa } from '@leximetrics/db';
import { useJarvisVoice } from '@/components/jarvis/JarvisVoice';

// Use a type compatible with Causa but flexible for the prompt's requirements
interface CausaCopilotProps {
    causa: Causa & {
        probabilidadExito?: number | null;
    };
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function CausaCopilot({ causa }: CausaCopilotProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const { speak, cancel, supported } = useJarvisVoice();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (content: string) => {
        if (!content.trim()) return;

        const userMessage: Message = { role: 'user', content };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        setError(null);

        try {
            // Prepare context payload
            const context = {
                snumcaso: causa.snumcaso,
                estado: causa.estado,
                montoDemanda: causa.montoDemanda,
                ultimaGestion: causa.ultimaGestion,
                probabilidadExito: causa.probabilidadExito,
            };

            const response = await apiClient.post<{ reply: string }>('/jarvis/causa-chat', {
                causaId: causa.id,
                messages: [...messages, userMessage],
                context,
            });

            const assistantMessage: Message = {
                role: 'assistant',
                content: response.reply || 'Lo siento, no pude generar una respuesta.',
            };

            setMessages((prev) => [...prev, assistantMessage]);

            if (voiceEnabled) {
                speak({ text: assistantMessage.content });
            }
        } catch (err) {
            console.error('Error sending message to Jarvis:', err);
            setError('Error al conectar con J.A.R.V.I.S. Por favor, intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(input);
        }
    };

    const suggestions = [
        'Explica el estado procesal actual',
        'Dame próximos pasos críticos',
        'Sugiere gestiones para mejorar la probabilidad de éxito',
        'Resume las gestiones recientes para el cliente',
    ];

    return (
        <div className="flex h-[600px] flex-col rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-slate-900 lg:h-full">
            {/* Header */}
            <div className="border-b border-gray-200 p-4 dark:border-gray-800">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                    <span>🤖</span> Copiloto J.A.R.V.I.S.
                </h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Estoy viendo la causa <span className="font-medium text-lex-primary">{causa.snumcaso || causa.rol}</span> contra{' '}
                    <span className="font-medium text-lex-primary">{causa.nombreDeudor || 'Deudor'}</span>. Puedo ayudarte con estrategia, escritos y riesgos.
                </p>
                {supported && (
                    <div className="mt-2 flex justify-end">
                        <button
                            onClick={() => {
                                if (voiceEnabled) cancel();
                                setVoiceEnabled(!voiceEnabled);
                            }}
                            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors ${voiceEnabled
                                ? 'bg-lex-primary/10 text-lex-primary'
                                : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-400'
                                }`}
                        >
                            <span>{voiceEnabled ? '🔊 Voz ON' : '🔇 Voz OFF'}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
                        <p className="text-sm">No hay mensajes aún.</p>
                        <p className="text-xs">Usa una sugerencia o escribe tu consulta.</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${msg.role === 'user'
                                ? 'bg-lex-primary text-white'
                                : 'bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-gray-200'
                                }`}
                        >
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                            {msg.role === 'assistant' && supported && (
                                <button
                                    onClick={() => speak({ text: msg.content })}
                                    className="mt-2 text-xs opacity-50 hover:opacity-100"
                                    title="Leer en voz alta"
                                >
                                    🔊
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="flex items-center space-x-2 rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-500 dark:bg-slate-800 dark:text-gray-400">
                            <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
                            <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
                            <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                            <span>J.A.R.V.I.S. está pensando...</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                        {error}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 dark:border-gray-800">
                {/* Suggestions */}
                <div className="mb-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {suggestions.map((s) => (
                        <button
                            key={s}
                            onClick={() => handleSendMessage(s)}
                            disabled={loading}
                            className="whitespace-nowrap rounded-full border border-lex-primary/20 bg-lex-primary/5 px-3 py-1 text-xs font-medium text-lex-primary hover:bg-lex-primary/10 disabled:opacity-50"
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribe tu consulta..."
                        disabled={loading}
                        className="flex-1 resize-none rounded-md border border-gray-300 p-2 text-sm focus:border-lex-primary focus:outline-none focus:ring-1 focus:ring-lex-primary dark:border-gray-700 dark:bg-slate-800 dark:text-white"
                        rows={1}
                        style={{ minHeight: '42px', maxHeight: '120px' }}
                    />
                    <button
                        onClick={() => handleSendMessage(input)}
                        disabled={loading || !input.trim()}
                        className="rounded-md bg-lex-primary px-4 py-2 text-white hover:bg-lex-accent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
