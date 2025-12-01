'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api';

type DeepHealthResponse = {
    status: string;
    services: Record<string, string>;
};

const SystemHealthPage: React.FC = () => {
    const [data, setData] = useState<DeepHealthResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await apiClient.get<DeepHealthResponse>('/health/deep');
                setData(res);
            } catch (e) {
                console.error(e);
                setError('No fue posible verificar el estado del sistema.');
            }
        };
        load();
    }, []);

    const statusColor = (status: string) => {
        switch (status) {
            case 'up':
                return 'text-green-600';
            case 'degraded':
                return 'text-yellow-600';
            default:
                return 'text-red-600';
        }
    };

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold text-lex-text">Estado del sistema</h1>
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-sm text-red-700 rounded">
                    {error}
                </div>
            )}
            {data && (
                <div className="space-y-3">
                    <p className={`font-semibold ${statusColor(data.status)}`}>
                        Estado general: {data.status.toUpperCase()}
                    </p>
                    <ul className="space-y-2">
                        {Object.entries(data.services).map(([name, status]) => (
                            <li key={name} className="flex items-center justify-between bg-white border border-lex-border rounded px-4 py-2">
                                <span className="text-sm font-medium text-lex-text">{name}</span>
                                <span className={`text-sm font-semibold ${statusColor(status)}`}>
                                    {status.toUpperCase()}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SystemHealthPage;
