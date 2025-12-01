'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import type { Causa, Gestion, Remate } from '@leximetrics/db';
import { CausaHeader } from '@/components/causa/CausaHeader';
import { CausaTabs } from '@/components/causa/CausaTabs';
import { CausaCopilot } from '@/components/causa/CausaCopilot';

interface CausaDetalle extends Causa {
    gestiones: Gestion[];
    remates: Remate[];
}

export default function CausaDetallePage() {
    const params = useParams();
    const id = params.id as string;

    const [causa, setCausa] = useState<CausaDetalle | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchCausa = async () => {
            try {
                setLoading(true);
                const data = await apiClient.get<CausaDetalle>(`/causas/${id}`);
                setCausa(data);
            } catch (err) {
                console.error('Error fetching causa detail:', err);
                setError('No se pudo cargar el detalle de la causa. Verifique permisos o si existe.');
            } finally {
                setLoading(false);
            }
        };

        fetchCausa();
    }, [id]);

    if (loading) {
        return <div className="p-6">Cargando detalle de la causa...</div>;
    }

    if (error || !causa) {
        return (
            <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded">
                Error: {error || 'Causa no encontrada.'}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-6 min-w-0">
                    <CausaHeader causa={causa} />
                    <CausaTabs causa={causa} />
                </div>
                <aside className="w-full lg:w-[400px] shrink-0">
                    <div className="sticky top-6">
                        <CausaCopilot causa={causa} />
                    </div>
                </aside>
            </div>
        </div>
    );
}
