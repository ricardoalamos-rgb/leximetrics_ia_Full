'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Gavel } from 'lucide-react';

interface Remate {
    id: string;
    fechaRemate: string;
    minimo: number | null;
    garantia: number | null;
    causa: {
        rol: string;
        caratula: string;
        tribunal: string;
    };
}

export default function RematesPage() {
    const [remates, setRemates] = useState<Remate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await apiClient.get<Remate[]>('/remates/upcoming');
                setRemates(data);
            } catch (err) {
                setError('Error al cargar los remates.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-lex-brand to-lex-vibrant-cyan bg-clip-text text-transparent">
                        Próximos Remates
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Gestión y seguimiento de fechas de remate.
                    </p>
                </div>
            </div>

            <Card className="border-t-4 border-t-lex-brand">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gavel className="w-5 h-5 text-lex-brand" />
                        Listado de Remates
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-lex-brand" />
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900">
                            {error}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Causa</TableHead>
                                    <TableHead>Mínimo</TableHead>
                                    <TableHead>Garantía</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {remates.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-gray-500 italic">
                                            No hay remates próximos registrados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    remates.map((remate) => (
                                        <TableRow key={remate.id}>
                                            <TableCell className="font-medium">
                                                {new Date(remate.fechaRemate).toLocaleDateString('es-CL', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-semibold text-lex-brand dark:text-lex-vibrant-cyan">{remate.causa.rol}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{remate.causa.tribunal}</div>
                                                <div className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-xs mt-1">{remate.causa.caratula}</div>
                                            </TableCell>
                                            <TableCell>
                                                {remate.minimo ? (
                                                    <span className="font-mono text-gray-700 dark:text-gray-300">
                                                        ${remate.minimo.toLocaleString('es-CL')}
                                                    </span>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {remate.garantia ? (
                                                    <span className="font-mono font-medium text-green-600 dark:text-green-400">
                                                        ${remate.garantia.toLocaleString('es-CL')}
                                                    </span>
                                                ) : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
