'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import { TableSkeleton } from '../ui/TableSkeleton';

interface Documento {
    id: string;
    nombre: string;
    tipo?: string | null;
    createdAt: string;
    url?: string | null;
}

interface ModuloDocumentosProps {
    causaId: string;
}

export const ModuloDocumentos = ({ causaId }: ModuloDocumentosProps) => {
    const [documentos, setDocumentos] = useState<Documento[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [uploading, setUploading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);

    const fetchDocs = async () => {
        try {
            setLoading(true);
            setError(null);
            // Ajusta el endpoint si tu API espera otros query params
            const data = await apiClient.get<Documento[]>(`/documentos?causaId=${causaId}`);
            setDocumentos(
                data.sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                ),
            );
        } catch (err: any) {
            console.error('Error cargando documentos', err);
            setError('No se pudieron cargar los documentos de la causa.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [causaId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            setFile(null);
            return;
        }
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;
        try {
            setUploading(true);
            setError(null);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('causaId', causaId);

            // Usamos fetch directo para multipart, pasando por el proxy BFF
            const resp = await fetch('/api/proxy/documentos', {
                method: 'POST',
                body: formData,
            });

            if (!resp.ok) {
                const text = await resp.text();
                console.error('Error al subir documento', text);
                throw new Error(text || 'Error al subir documento');
            }

            setFile(null);
            await fetchDocs();
        } catch (err: any) {
            console.error(err);
            setError('No se pudo subir el documento. Inténtalo nuevamente.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar este documento?')) return;
        try {
            setError(null);
            await apiClient.delete(`/documentos/${id}`);
            setDocumentos((prev) => prev.filter((d) => d.id !== id));
        } catch (err: any) {
            console.error(err);
            setError('No se pudo eliminar el documento.');
        }
    };

    return (
        <div className="space-y-4">
            {/* Header + uploader */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-lex-text">Documentos de la causa</h2>
                    <p className="text-xs text-gray-500">
                        Sube escritos, resoluciones, contratos y otros documentos relevantes. La IA podrá usarlos para análisis
                        y generación de borradores.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="text-xs"
                    />
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium border border-lex-border bg-white text-lex-text hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? 'Subiendo…' : 'Subir documento'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700">
                    {error}
                </div>
            )}

            {/* Lista */}
            <div className="bg-white rounded-lg border border-lex-border shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-lex-border">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Nombre
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Tipo
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Fecha
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-lex-border">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-4">
                                    <TableSkeleton rows={4} cols={4} />
                                </td>
                            </tr>
                        ) : documentos.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                                    No hay documentos asociados a esta causa todavía.
                                </td>
                            </tr>
                        ) : (
                            documentos.map((doc) => {
                                const fecha = new Date(doc.createdAt);
                                const fechaStr = fecha.toLocaleString('es-CL', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                });

                                return (
                                    <tr key={doc.id}>
                                        <td className="px-4 py-2 text-sm text-lex-text">
                                            {doc.nombre}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600">
                                            {doc.tipo ?? 'Documento'}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600">
                                            {fechaStr}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-right">
                                            <div className="flex justify-end gap-2">
                                                {doc.url && (
                                                    <a
                                                        href={doc.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-lex-accent hover:underline"
                                                    >
                                                        Ver
                                                    </a>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(doc.id)}
                                                    className="text-xs text-red-500 hover:underline"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
