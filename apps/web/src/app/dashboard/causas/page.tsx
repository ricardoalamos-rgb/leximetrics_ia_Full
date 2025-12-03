'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Causa, EstadoCausa } from '@leximetrics/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, FileText, ArrowRight } from 'lucide-react';

interface DashboardCausa extends Omit<Causa, 'probabilidadExito'> {
    probabilidadExito?: number | null;
}

export default function CausasPage() {
    const [causas, setCausas] = useState<DashboardCausa[]>([]);
    const [filteredCausas, setFilteredCausas] = useState<DashboardCausa[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await apiClient.get<DashboardCausa[]>('/causas');
                setCausas(data);
                setFilteredCausas(data);
            } catch (err) {
                setError('Error al cargar las causas.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = causas.filter(c =>
            c.rol.toLowerCase().includes(lowerTerm) ||
            c.caratula.toLowerCase().includes(lowerTerm) ||
            c.tribunal.toLowerCase().includes(lowerTerm) ||
            (c.nombreDeudor && c.nombreDeudor.toLowerCase().includes(lowerTerm))
        );
        setFilteredCausas(filtered);
    }, [searchTerm, causas]);

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case EstadoCausa.PREJUDICIAL: return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
            case EstadoCausa.TRAMITACION: return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
            case EstadoCausa.SENTENCIA: return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
            case EstadoCausa.ARCHIVADA: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
            case EstadoCausa.SUSPENDIDA: return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
            case EstadoCausa.SIN_DEMANDA: return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
            case EstadoCausa.SIN_NOTIFICAR: return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
            case EstadoCausa.NOTIFICADO: return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800';
            case EstadoCausa.EMBARGADO: return 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800';
            case EstadoCausa.ETAPA_REMATE: return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800';
            case EstadoCausa.TERMINADA: return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-lex-brand to-lex-vibrant-cyan bg-clip-text text-transparent">
                        Buscador de Causas
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Explora y gestiona todas tus causas judiciales.
                    </p>
                </div>
            </div>

            <Card className="border-t-4 border-t-lex-brand">
                <CardHeader>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por ROL, Carátula, Tribunal o Deudor..."
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-lex-brand focus:ring-2 focus:ring-lex-brand/20 transition-all outline-none dark:bg-slate-800 dark:border-gray-700 dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
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
                                    <TableHead>Rol / Tribunal</TableHead>
                                    <TableHead>Carátula / Deudor</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Última Gestión</TableHead>
                                    <TableHead className="text-right">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCausas.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12">
                                            <div className="flex flex-col items-center text-gray-500">
                                                <FileText className="w-12 h-12 mb-3 opacity-20" />
                                                <p>No se encontraron causas que coincidan con tu búsqueda.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredCausas.map((causa) => (
                                        <TableRow key={causa.id} className="group cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10">
                                            <TableCell>
                                                <div className="font-bold text-lex-brand dark:text-lex-vibrant-cyan group-hover:text-lex-primary transition-colors">
                                                    {causa.rol}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                                    {causa.tribunal}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-gray-900 dark:text-white line-clamp-1">
                                                    {causa.caratula}
                                                </div>
                                                {causa.nombreDeudor && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                                        {causa.nombreDeudor}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getEstadoColor(causa.estado)}`}>
                                                    {causa.estado}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                                    {causa.ultimaGestion ? new Date(causa.ultimaGestion).toLocaleDateString('es-CL') : '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link
                                                    href={`/dashboard/causas/${causa.id}`}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-lex-brand hover:text-white transition-all duration-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-lex-brand"
                                                >
                                                    <ArrowRight className="w-4 h-4" />
                                                </Link>
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
