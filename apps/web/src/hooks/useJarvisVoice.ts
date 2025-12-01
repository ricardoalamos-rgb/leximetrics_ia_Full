'use client';

import { useEffect, useRef, useState } from 'react';

type UseJarvisVoiceOptions = {
    onCommand: (text: string) => void;
    hotword?: string; // por defecto: "jarvis"
};

// Add basic type definitions for SpeechRecognition
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: (event: any) => void;
    onend: () => void;
}


export const useJarvisVoice = ({ onCommand, hotword = 'jarvis' }: UseJarvisVoiceOptions) => {
    const [listening, setListening] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('SpeechRecognition no está disponible en este navegador.');
            return;
        }

        const recognition: SpeechRecognition = new SpeechRecognition();
        recognition.lang = 'es-CL';
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
            const last = event.results[event.results.length - 1];
            if (!last || !last.isFinal) return;

            const text = last[0].transcript.trim().toLowerCase();
            if (!text) return;

            const hot = hotword.toLowerCase();
            const index = text.indexOf(hot);
            if (index >= 0) {
                const command = text.slice(index + hot.length).trim();
                if (command) {
                    onCommand(command);
                }
            }
        };

        recognition.onend = () => {
            if (listening) {
                recognition.start();
            }
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.stop();
            recognitionRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const recognition = recognitionRef.current;
        if (!recognition) return;

        if (listening) {
            recognition.start();
        } else {
            recognition.stop();
        }
    }, [listening]);

    const toggleListening = () => {
        setListening((prev) => !prev);
    };

    return {
        listening,
        toggleListening,
    };
};
