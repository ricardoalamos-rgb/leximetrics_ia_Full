'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

interface CausaRiskSummary {
    id: string;
    snumcaso: string;
    rol: string;
    nombreDeudor?: string;
    estado: string;
    diasSinGestion: number;
    riesgoInactividad: 'VERDE' | 'AMARILLO' | 'ROJO';
    riesgoProcesal: 'BAJO' | 'MEDIO' | 'ALTO';
    fechaProximoRemate?: string;
}

export default function CausasRojasPage() {
    const [causas, setCausas] = useState<CausaRiskSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCausasRojas = async () => {
            try {
                const data = await apiClient.get<CausaRiskSummary[]>('/risk/causas-rojas');
                setCausas(data);
            } catch (err: any) {
                setError(err.message || 'Error al cargar causas en riesgo');
            } finally {
                setLoading(false);
            }
        };

        fetchCausasRojas();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center flex-col gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-red-600" />
                <span className="text-red-600 font-medium animate-pulse">Analizando riesgos críticos...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="rounded-xl bg-red-50 p-6 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900 shadow-sm">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Error de Carga
                    </h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-red-600 dark:text-red-500 flex items-center gap-3">
                        <span className="relative flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                        </span>
                        Causas en Rojo
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
                        Atención prioritaria: <span className="text-red-600 font-bold">{causas.length}</span> causas requieren gestión inmediata.
                    </p>
                </div>
            </div>

            {causas.length === 0 ? (
                <Card className="border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-green-800 dark:text-green-400 mb-2">¡Todo bajo control!</h3>
                        <p className="text-green-600 dark:text-green-500 text-lg">No hay causas con riesgo crítico en este momento.</p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-t-4 border-t-red-500 shadow-medium">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rol / Tribunal</TableHead>
                                    <TableHead>Deudor</TableHead>
                                    <TableHead>Inactividad</TableHead>
                                    <TableHead>Riesgo Proc.</TableHead>
                                    <TableHead className="text-right">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {causas.map((causa) => (
                                    <TableRow key={causa.id} className="hover:bg-red-50/30 dark:hover:bg-red-900/10">
                                        <TableCell>
                                            <div className="font-bold text-gray-900 dark:text-white">{causa.rol}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{causa.snumcaso}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{causa.nombreDeudor || 'N/A'}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className={`h-2.5 w-2.5 rounded-full shadow-sm ${causa.riesgoInactividad === 'ROJO' ? 'bg-red-500 animate-pulse' :
                                                    causa.riesgoInactividad === 'AMARILLO' ? 'bg-yellow-500' : 'bg-green-500'
                                                    }`}></span>
                                                <span className={`text-sm font-bold ${causa.riesgoInactividad === 'ROJO' ? 'text-red-600' : 'text-gray-600'}`}>
                                                    {causa.diasSinGestion} días
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold border ${causa.riesgoProcesal === 'ALTO' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300' :
                                                causa.riesgoProcesal === 'MEDIO' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                    'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300'
                                                }`}>
                                                {causa.riesgoProcesal}
                                            </span>
                                            {causa.fechaProximoRemate && (
                                                <div className="mt-1 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Remate: {new Date(causa.fechaProximoRemate).toLocaleDateString()}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link
                                                href={`/dashboard/causas/${causa.id}`}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-200 shadow-sm hover:shadow-md"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
