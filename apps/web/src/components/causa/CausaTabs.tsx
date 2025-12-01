'use client';

import { useState } from 'react';
import type { Causa, Gestion } from '@leximetrics/db';
import { TimelineGestiones } from './TimelineGestiones';
import { ModuloDocumentos } from './ModuloDocumentos';
import { PlaceholderModule } from './PlaceholderModule';
import { CausaJarvisPanel } from './CausaJarvisPanel';

const TABS = [
    { id: 'timeline', name: 'Historial y Gestiones' },
    { id: 'documentos', name: 'Documentos' },
    { id: 'jarvis', name: 'JARVIS' },
    { id: 'gastos', name: 'Gastos' },
    { id: 'comentarios', name: 'Discusión' },
    { id: 'alertas', name: 'Alertas' },
    { id: 'remates', name: 'Remates' },
];

interface CausaConRelaciones extends Causa {
    gestiones?: Gestion[];
}

interface CausaTabsProps {
    causa: CausaConRelaciones;
}

export const CausaTabs = ({ causa }: CausaTabsProps) => {
    const [activeTab, setActiveTab] = useState<string>('timeline');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'timeline':
                return (
                    <TimelineGestiones
                        causaId={causa.id}
                        gestiones={(causa.gestiones ?? []) as Gestion[]}
                    />
                );
            case 'documentos':
                return <ModuloDocumentos causaId={causa.id} />;
            case 'jarvis':
                return <CausaJarvisPanel causaId={causa.id} />;
            case 'gastos':
                return <PlaceholderModule name="Gastos" />;
            case 'comentarios':
                return <PlaceholderModule name="Discusión" />;
            case 'alertas':
                return <PlaceholderModule name="Alertas" />;
            case 'remates':
                return <PlaceholderModule name="Remates" />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-4">
            <div className="border-b border-lex-border">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    {TABS.map((tab) => {
                        const isActive = tab.id === activeTab;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`whitespace-nowrap py-3 px-4 border-b-2 text-sm font-medium focus:outline-none transition-colors ${isActive
                                        ? 'border-lex-accent text-lex-accent'
                                        : 'border-transparent text-gray-500 hover:text-lex-text hover:border-gray-300'
                                    }`}
                            >
                                {tab.name}
                            </button>
                        );
                    })}
                </nav>
            </div>
            {renderTabContent()}
        </div>
    );
};
