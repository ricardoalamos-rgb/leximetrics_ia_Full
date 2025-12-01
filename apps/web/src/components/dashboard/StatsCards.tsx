import React from 'react';

interface StatsCardsProps {
    totalCausas: number;
    altoRiesgo: number;
    rematesProximos: number;
    pendientesIA: number;
}

export function StatsCards({
    totalCausas,
    altoRiesgo,
    rematesProximos,
    pendientesIA,
}: StatsCardsProps) {
    const cards = [
        {
            title: 'Total Causas',
            value: totalCausas,
            caption: 'Causas activas',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Riesgo Alto',
            value: altoRiesgo,
            caption: 'Prioriza primero',
            color: 'text-red-600',
            bgColor: 'bg-red-50',
        },
        {
            title: 'Remates Próximos',
            value: rematesProximos,
            caption: 'Evita prescripciones', // Placeholder text as requested, though "Evita prescripciones" fits better for risk. Using "Próximos eventos" or similar might be better but sticking to prompt suggestion or similar vibe.
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
        },
        {
            title: 'Tareas IA',
            value: pendientesIA,
            caption: 'Sugerencias listas',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-slate-800"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {card.title}
                            </p>
                            <p className={`mt-2 text-3xl font-bold ${card.color}`}>
                                {card.value}
                            </p>
                        </div>
                        <div className={`rounded-full p-3 ${card.bgColor} dark:bg-opacity-10`}>
                            {/* Simple icon placeholder or just color block */}
                            <div className={`h-4 w-4 ${card.color}`} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            {card.caption}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
