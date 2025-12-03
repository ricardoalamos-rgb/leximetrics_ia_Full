import React from 'react';
import { TrendingUp, AlertTriangle, Gavel, Sparkles } from 'lucide-react';

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
            icon: TrendingUp,
            gradient: 'from-blue-500 to-cyan-500',
            bgGradient: 'from-blue-50 to-cyan-50',
            darkBgGradient: 'dark:from-blue-950/30 dark:to-cyan-950/30',
            iconColor: 'text-blue-600 dark:text-blue-400',
            glowColor: 'group-hover:shadow-blue-500/20',
        },
        {
            title: 'Riesgo Alto',
            value: altoRiesgo,
            caption: 'Prioriza primero',
            icon: AlertTriangle,
            gradient: 'from-red-500 to-orange-500',
            bgGradient: 'from-red-50 to-orange-50',
            darkBgGradient: 'dark:from-red-950/30 dark:to-orange-950/30',
            iconColor: 'text-red-600 dark:text-red-400',
            glowColor: 'group-hover:shadow-red-500/20',
        },
        {
            title: 'Remates Próximos',
            value: rematesProximos,
            caption: 'Gestiones pendientes',
            icon: Gavel,
            gradient: 'from-amber-500 to-yellow-500',
            bgGradient: 'from-amber-50 to-yellow-50',
            darkBgGradient: 'dark:from-amber-950/30 dark:to-yellow-950/30',
            iconColor: 'text-amber-600 dark:text-amber-400',
            glowColor: 'group-hover:shadow-amber-500/20',
        },
        {
            title: 'Tareas IA',
            value: pendientesIA,
            caption: 'Sugerencias listas',
            icon: Sparkles,
            gradient: 'from-purple-500 to-pink-500',
            bgGradient: 'from-purple-50 to-pink-50',
            darkBgGradient: 'dark:from-purple-950/30 dark:to-pink-950/30',
            iconColor: 'text-purple-600 dark:text-purple-400',
            glowColor: 'group-hover:shadow-purple-500/20',
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <div
                        key={index}
                        className={`group relative rounded-2xl bg-gradient-to-br ${card.bgGradient} ${card.darkBgGradient} border-2 border-white/50 dark:border-gray-700/50 p-6 shadow-soft hover:shadow-xl transition-all duration-500 hover:-translate-y-2 ${card.glowColor} overflow-hidden animate-fade-in`}
                        style={{
                            animationDelay: `${index * 100}ms`
                        }}
                    >
                        {/* Background Decoration */}
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.gradient} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity duration-500`}></div>

                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                        {card.title}
                                    </p>
                                    <p className={`mt-3 text-4xl font-extrabold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
                                        {card.value}
                                    </p>
                                </div>
                                <div className={`rounded-xl p-3 bg-gradient-to-br ${card.gradient} shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                                    <Icon className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                    {card.caption}
                                </p>
                            </div>
                        </div>

                        {/* Shimmer Effect on Hover */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                            <div className="shimmer"></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
