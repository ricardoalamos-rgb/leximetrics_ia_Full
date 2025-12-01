import { Causa, EstadoCausa } from "@leximetrics/db";
import { RiskBadge } from './RiskBadge';

interface CausaHeaderProps {
    causa: Causa;
}

export function CausaHeader({ causa }: CausaHeaderProps) {
    const getEstadoBadge = (estado: EstadoCausa) => {
        const styles = {
            [EstadoCausa.PREJUDICIAL]: "bg-yellow-100 text-yellow-800",
            [EstadoCausa.TRAMITACION]: "bg-blue-100 text-blue-800",
            [EstadoCausa.SENTENCIA]: "bg-purple-100 text-purple-800",
            [EstadoCausa.ARCHIVADA]: "bg-gray-100 text-gray-800",
            [EstadoCausa.SUSPENDIDA]: "bg-red-100 text-red-800",
            [EstadoCausa.SIN_DEMANDA]: "bg-orange-100 text-orange-800",
            [EstadoCausa.SIN_NOTIFICAR]: "bg-orange-100 text-orange-800",
            [EstadoCausa.NOTIFICADO]: "bg-indigo-100 text-indigo-800",
            [EstadoCausa.EMBARGADO]: "bg-pink-100 text-pink-800",
            [EstadoCausa.ETAPA_REMATE]: "bg-red-100 text-red-800",
            [EstadoCausa.TERMINADA]: "bg-green-100 text-green-800",
            [EstadoCausa.SUSPENDIDO]: "bg-red-100 text-red-800",
        };
        return (
            <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${styles[estado] || "bg-gray-100 text-gray-800"
                    }`}
            >
                {estado}
            </span>
        );
    };

    return (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-slate-800">
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {causa.caratula}
                        </h1>
                        {getEstadoBadge(causa.estado)}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Rol:</span>
                            {causa.rol}
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Tribunal:</span>
                            {causa.tribunal}
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="font-medium text-gray-700 dark:text-gray-300">ID:</span>
                            <span className="font-mono text-xs">{causa.id}</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    {/* Metrics placeholder */}
                    <div className="text-sm text-gray-500">Probabilidad de Éxito</div>
                    <div className="text-xl font-bold text-green-600">Alta</div>
                </div>
            </div>
        </div>
    );
}
