'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseJarvisVoiceCommandsOptions {
    onCommand: (command: string) => void;
}

interface UseJarvisVoiceCommandsReturn {
    isSupported: boolean;
    isListening: boolean;
    lastCommand: string | null;
    error: string | null;
    toggleListening: () => void;
}

export function useJarvisVoiceCommands(
    options: UseJarvisVoiceCommandsOptions,
): UseJarvisVoiceCommandsReturn {
    const [isSupported, setIsSupported] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [lastCommand, setLastCommand] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);
    const restartTimeoutRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-CL';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            const lower = transcript.toLowerCase();

            // Buscamos palabra clave "jarvis"
            const wakeIndex = lower.indexOf('jarvis');
            if (wakeIndex >= 0) {
                const after = lower.slice(wakeIndex + 'jarvis'.length).trim();
                if (after.length > 0) {
                    setLastCommand(after);
                    options.onCommand(after);
                }
            }
        };

        recognition.onerror = (event: any) => {
            console.error('[JarvisVoice] error:', event);
            setError(event.error || 'Error en reconocimiento de voz');
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
            // Reinicio suave si se cortó solo
            if (restartTimeoutRef.current) {
                clearTimeout(restartTimeoutRef.current);
            }
            restartTimeoutRef.current = setTimeout(() => {
                if (recognitionRef.current && isListening) {
                    recognitionRef.current.start();
                }
            }, 500);
        };

        recognitionRef.current = recognition;
        setIsSupported(true);

        return () => {
            if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
            recognition.stop();
        };
    }, [options]);

    const toggleListening = useCallback(() => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setError(null);
            recognitionRef.current.start();
            setIsListening(true);
        }
    }, [isListening]);

    return { isSupported, isListening, lastCommand, error, toggleListening };
}
