'use client';

import { useState, useEffect, useCallback } from 'react';

interface SpeakOptions {
    text: string;
    lang?: string; // default 'es-CL'
}

export function useJarvisVoice() {
    const [supported, setSupported] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            setSupported(true);
        }
    }, []);

    const speak = useCallback((options: SpeakOptions & { audioUrl?: string }) => {
        // If audioUrl is provided (Premium Voice from Backend), use it
        if (options.audioUrl) {
            if (audio) {
                audio.pause();
            }
            const newAudio = new Audio(options.audioUrl);
            setAudio(newAudio);
            setSpeaking(true);
            newAudio.play().catch(e => console.error("Error playing audio", e));
            newAudio.onended = () => setSpeaking(false);
            newAudio.onerror = () => setSpeaking(false);
            return;
        }

        // Fallback to Web Speech API
        if (!supported) return;

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(options.text);
        utterance.lang = options.lang || 'es-CL';

        // Configuration for "J.A.R.V.I.S. Masculine" persona (Fallback)
        utterance.rate = 1.1; // Slightly faster than normal but grave
        utterance.pitch = 0.8; // Lower pitch (masculine)

        // Try to find a male Spanish voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
            (v) => v.lang.includes('es') && (v.name.includes('Male') || v.name.includes('Jorge') || v.name.includes('Diego'))
        ) || voices.find((v) => v.lang.includes('es'));

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, [supported, audio]);

    const cancel = useCallback(() => {
        if (audio) {
            audio.pause();
            setSpeaking(false);
        }
        if (supported) {
            window.speechSynthesis.cancel();
            setSpeaking(false);
        }
    }, [supported, audio]);

    return { speak, cancel, supported, speaking };
}
