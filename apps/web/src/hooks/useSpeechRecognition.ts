'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionType = any;
type SpeechRecognitionErrorEventType = any;

export type JarvisNavigationTarget =
    | 'DASHBOARD'
    | 'CAUSAS'
    | 'REMATES'
    | 'DOCWORKS'
    | 'JARVIS'
    | 'AI_ANALYTICS';

export interface JarvisCommand {
    type: 'NAVIGATE';
    target: JarvisNavigationTarget;
    originalText: string;
}

export interface UseSpeechRecognitionOptions {
    /**
     * Se ejecuta cuando tenemos un texto final listo para usar
     * (ej: la pregunta que el usuario hizo después de decir "JARVIS").
     */
    onFinalQuery: (query: string) => void;
    /**
     * Se ejecuta cuando detectamos un comando de control
     * (ej: "abre docworks", "ve a remates").
     */
    onCommand?: (command: JarvisCommand) => void;
    /**
     * Idioma de reconocimiento (por defecto español chileno).
     */
    lang?: string;
    /**
     * Palabra clave de activación (por defecto "jarvis").
     */
    activationKeyword?: string;
    /**
     * Si true, detiene el reconocimiento automáticamente cuando dispara una query/comando.
     */
    autoStopOnActivation?: boolean;
}

export interface UseSpeechRecognitionState {
    isSupported: boolean;
    isListening: boolean;
    isActivated: boolean;
    interimTranscript: string;
    error: string | null;
    startListening: () => void;
    stopListening: () => void;
    toggleListening: () => void;
    resetActivation: () => void;
}

function normalizeForCommand(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // quitar tildes
}

function detectNavigationTarget(rest: string): JarvisNavigationTarget | null {
    if (
        rest.includes('docworks') ||
        rest.includes('doc works') ||
        rest.includes('documentos inteligentes')
    ) {
        return 'DOCWORKS';
    }

    if (rest.includes('remate') || rest.includes('remates')) {
        return 'REMATES';
    }

    if (rest.includes('causa') || rest.includes('causas')) {
        return 'CAUSAS';
    }

    if (
        rest.includes('dashboard') ||
        rest.includes('inicio') ||
        rest.includes('home') ||
        rest.includes('panel')
    ) {
        return 'DASHBOARD';
    }

    if (rest.includes('jarvis')) {
        return 'JARVIS';
    }

    if (
        rest.includes('analitica') ||
        rest.includes('analiticas') ||
        rest.includes('analíticas') ||
        rest.includes('metricas') ||
        rest.includes('analiticas de ia')
    ) {
        return 'AI_ANALYTICS';
    }

    return null;
}

function detectCommandFromText(text: string): JarvisCommand | null {
    const normalized = normalizeForCommand(text);

    const patterns = ['abre ', 'abrir ', 've a ', 'ir a ', 'anda a '];
    let rest = normalized;
    let matched = false;

    for (const p of patterns) {
        if (normalized.startsWith(p)) {
            rest = normalized.slice(p.length).trim();
            matched = true;
            break;
        }
    }

    if (!matched) {
        // No empieza con un verbo de navegación -> no es comando
        return null;
    }

    if (!rest) return null;

    const target = detectNavigationTarget(rest);
    if (!target) return null;

    return {
        type: 'NAVIGATE',
        target,
        originalText: text,
    };
}

/**
 * Hook de reconocimiento de voz para J.A.R.V.I.S.
 * - Usa Web Speech API (SpeechRecognition / webkitSpeechRecognition)
 * - Detecta palabra clave "JARVIS" (case-insensitive)
 * - Extrae la pregunta posterior y la envía vía onFinalQuery
 * - Detecta comandos de control ("abre docworks", "ve a remates") vía onCommand
 */
export function useSpeechRecognition(
    options: UseSpeechRecognitionOptions,
): UseSpeechRecognitionState {
    const {
        onFinalQuery,
        onCommand,
        lang = 'es-CL',
        activationKeyword = 'jarvis',
        autoStopOnActivation = false,
    } = options;

    const [isSupported, setIsSupported] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isActivated, setIsActivated] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<SpeechRecognitionType | null>(null);

    const latestOnFinalQuery = useRef(onFinalQuery);
    const latestOnCommand = useRef(onCommand);

    useEffect(() => {
        latestOnFinalQuery.current = onFinalQuery;
    }, [onFinalQuery]);

    useEffect(() => {
        latestOnCommand.current = onCommand;
    }, [onCommand]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const SpeechRecognitionImpl =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (!SpeechRecognitionImpl) {
            setIsSupported(false);
            return;
        }

        setIsSupported(true);

        const recognition: SpeechRecognitionType = new SpeechRecognitionImpl();
        recognition.lang = lang;
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEventType) => {
            console.error('SpeechRecognition error', event);
            setError('Error en el reconocimiento de voz. Intenta nuevamente.');
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            let interim = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const transcript: string = result[0].transcript;

                if (result.isFinal) {
                    finalTranscript += transcript;
                } else {
                    interim += transcript;
                }
            }

            if (interim) {
                setInterimTranscript(interim);
            }

            if (!finalTranscript) return;

            setInterimTranscript('');

            const normalized = finalTranscript.trim();
            const lower = normalized.toLowerCase();
            const keyword = activationKeyword.toLowerCase();

            let content = normalized;

            // Caso 1: el usuario dice "JARVIS ..." en la misma frase
            if (lower.startsWith(keyword)) {
                const withoutKeyword = normalized
                    .slice(keyword.length)
                    .replace(/^[,:\-\s]+/, '')
                    .trim();

                if (!withoutKeyword) {
                    // Sólo dijo "JARVIS" → marcamos activado y esperamos siguiente frase
                    setIsActivated(true);
                    return;
                }

                setIsActivated(true);
                content = withoutKeyword;
            } else if (isActivated) {
                // Caso 2: el usuario ya dijo "JARVIS" antes, ahora viene la pregunta/comando
                content = normalized;
            } else {
                // No hay palabra clave ni estado activado → ignoramos
                return;
            }

            // 1) Intentar detectar comando de control
            if (latestOnCommand.current) {
                const command = detectCommandFromText(content);
                if (command) {
                    latestOnCommand.current(command);

                    if (autoStopOnActivation && recognitionRef.current) {
                        try {
                            recognitionRef.current.stop();
                        } catch (e) {
                            console.warn('Error stopping recognition', e);
                        }
                    }

                    setIsActivated(false);
                    return;
                }
            }

            // 2) Si no es comando, lo tratamos como pregunta normal
            if (content && latestOnFinalQuery.current) {
                latestOnFinalQuery.current(content);

                if (autoStopOnActivation && recognitionRef.current) {
                    try {
                        recognitionRef.current.stop();
                    } catch (e) {
                        console.warn('Error stopping recognition', e);
                    }
                }
            }
        };

        recognitionRef.current = recognition;

        return () => {
            try {
                recognition.stop();
            } catch {
                // no-op
            }
            recognitionRef.current = null;
        };
    }, [activationKeyword, autoStopOnActivation, lang, isActivated]);

    const startListening = useCallback(() => {
        if (!recognitionRef.current) return;
        setError(null);
        try {
            recognitionRef.current.start();
        } catch (e) {
            console.warn('SpeechRecognition already started?', e);
        }
    }, []);

    const stopListening = useCallback(() => {
        if (!recognitionRef.current) return;
        try {
            recognitionRef.current.stop();
        } catch (e) {
            console.warn('SpeechRecognition stop error', e);
        }
        setIsListening(false);
        setInterimTranscript('');
    }, []);

    const toggleListening = useCallback(() => {
        if (!isSupported) return;
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isSupported, isListening, startListening, stopListening]);

    const resetActivation = useCallback(() => {
        setIsActivated(false);
    }, []);

    return {
        isSupported,
        isListening,
        isActivated,
        interimTranscript,
        error,
        startListening,
        stopListening,
        toggleListening,
        resetActivation,
    };
}
