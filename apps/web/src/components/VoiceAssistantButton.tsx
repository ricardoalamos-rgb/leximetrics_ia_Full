'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useJarvisVoice } from '../hooks/useJarvisVoice';
import { handleJarvisCommand } from '../lib/jarvisCommands';
import { Mic, MicOff } from 'lucide-react';

export const VoiceAssistantButton: React.FC = () => {
    const router = useRouter();
    const [lastMessage, setLastMessage] = useState<string | null>(null);

    const { listening, toggleListening } = useJarvisVoice({
        onCommand: (cmd) => {
            const feedback = handleJarvisCommand(cmd, router);
            setLastMessage(feedback);
            setTimeout(() => setLastMessage(null), 4000);
        },
    });

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
            {lastMessage && (
                <div className="max-w-xs px-3 py-2 rounded-lg bg-black/80 text-white text-xs shadow-lg">
                    {lastMessage}
                </div>
            )}
            <button
                type="button"
                onClick={toggleListening}
                className={`inline-flex items-center justify-center w-11 h-11 rounded-full shadow-lg border border-lex-border bg-white ${listening ? 'ring-2 ring-lex-accent' : ''
                    }`}
                title={listening ? 'JARVIS está escuchando…' : 'Activar micrófono para hablar con JARVIS'}
            >
                <span className="sr-only">JARVIS Voice</span>
                {listening ? <Mic className="w-5 h-5 text-lex-accent" /> : <MicOff className="w-5 h-5 text-gray-600" />}
            </button>
        </div>
    );
};
