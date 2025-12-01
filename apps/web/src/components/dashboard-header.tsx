'use client';

import { useRouter } from 'next/navigation';
import { LogoutButton } from './logout-button';
import { useJarvisVoiceCommands } from '@/hooks/useJarvisVoiceCommands';

interface DashboardHeaderProps {
    userName: string | null;
    userRole: string | null;
}

export const DashboardHeader = ({ userName, userRole }: DashboardHeaderProps) => {
    const router = useRouter();

    const handleCommand = (command: string) => {
        const c = command.toLowerCase();

        if (c.includes('docworks')) {
            router.push('/dashboard/docworks');
        } else if (c.includes('remate')) {
            router.push('/dashboard/remates');
        } else if (c.includes('causa')) {
            router.push('/dashboard/causas');
        } else if (c.includes('dashboard') || c.includes('inicio') || c.includes('home')) {
            router.push('/dashboard');
        }
        // Aquí puedes ir añadiendo más patrones si quieres
    };

    const { isSupported, isListening, lastCommand, error, toggleListening } =
        useJarvisVoiceCommands({ onCommand: handleCommand });

    return (
        <header className="bg-white shadow-md p-4 flex justify-between items-center border-b border-lex-border sticky top-0 z-10">
            <div className="flex flex-col">
                <h2 className="text-xl font-semibold text-lex-text">Panel de Control</h2>
                {isSupported && (
                    <span className="text-xs text-gray-500">
                        Di <strong>“JARVIS, abre DocWorks”</strong>, “JARVIS, abre Remates”, etc.
                    </span>
                )}
            </div>
            <div className="flex items-center space-x-4">
                {isSupported ? (
                    <button
                        type="button"
                        onClick={toggleListening}
                        className={`flex items-center px-3 py-1 rounded-full text-sm border ${isListening
                                ? 'bg-lex-success/10 border-lex-success text-lex-success'
                                : 'bg-lex-primary/10 border-lex-primary text-lex-primary'
                            }`}
                    >
                        <span className="mr-2">{isListening ? '🎙️' : '🎧'}</span>
                        {isListening ? 'JARVIS escuchando...' : 'Activar JARVIS voz'}
                    </button>
                ) : (
                    <span className="text-xs text-gray-400">
                        Reconocimiento de voz no soportado en este navegador.
                    </span>
                )}
                <span className="text-sm text-lex-text">
                    {userName} ({userRole})
                </span>
                <LogoutButton />
            </div>
            {error && (
                <div className="absolute right-4 top-full mt-2 text-xs bg-red-100 text-red-700 p-2 rounded border border-red-300">
                    Error voz: {error}
                </div>
            )}
            {lastCommand && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 text-xs bg-lex-background border border-lex-border px-3 py-1 rounded">
                    Último comando: <span className="font-mono">{lastCommand}</span>
                </div>
            )}
        </header>
    );
};
