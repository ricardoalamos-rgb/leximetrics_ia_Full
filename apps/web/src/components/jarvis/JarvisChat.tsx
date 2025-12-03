'use client';

import React, { useState, useRef, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    correlationId?: string;
}

interface JarvisChatProps {
    initialMessages?: Message[];
    context?: Record<string, any>;
    causaId?: string | null;
    placeholder?: string;
}

export function JarvisChat({
    initialMessages = [],
    context,
    causaId,
    placeholder = 'Escribe tu consulta a J.A.R.V.I.S....',
}: JarvisChatProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
            const response = await apiClient.post<{ reply: string; correlation_id?: string }>('/jarvis/ask-causa', {
                causaId: causaId || null,
                messages: [...messages, userMessage],
                context,
            });

            const assistantMessage: Message = {
                role: 'assistant',
                content: response.reply || 'Lo siento, no pude generar una respuesta.',
                correlationId: response.correlation_id,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (err) {
            console.error('Error sending message to Jarvis:', err);
            setError('Error al conectar con J.A.R.V.I.S.');
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

    const sendFeedback = async (correlationId: string, useful: boolean) => {
        try {
            await apiClient.post('/jarvis/feedback', {
                correlationId,
                useful,
            });
            console.log('Feedback sent:', useful);
        } catch (err) {
            console.error('Error sending feedback:', err);
        }
    };

    return (
        <div className="flex h-full flex-col bg-white dark:bg-slate-900">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
                        <div className="mb-4 rounded-full bg-lex-primary/10 p-4">
                            <span className="text-4xl">🤖</span>
                        </div>
                        <p className="text-lg font-medium text-gray-600 dark:text-gray-300">J.A.R.V.I.S.</p>
                        <p className="text-sm">Tu asistente legal inteligente.</p>
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
                            {msg.role === 'assistant' && msg.correlationId && (
                                <div className="mt-2 flex gap-2 text-xs text-gray-500 border-t border-gray-200 pt-2 dark:border-gray-700">
                                    <span>¿Te fue útil?</span>
                                    <button
                                        onClick={() => sendFeedback(msg.correlationId!, true)}
                                        className="px-2 py-1 rounded hover:bg-green-100 hover:text-green-700 transition-colors"
                                    >
                                        👍 Sí
                                    </button>
                                    <button
                                        onClick={() => sendFeedback(msg.correlationId!, false)}
                                        className="px-2 py-1 rounded hover:bg-red-100 hover:text-red-700 transition-colors"
                                    >
                                        👎 No
                                    </button>
                                </div>
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
                <div className="flex gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
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
