'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/lib/api';
import { Loader2, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CausaRow {
    rol: string;
    caratula: string;
    tribunal: string;
    rutDeudor?: string;
    nombreDeudor?: string;
    montoDemanda?: number;
    fechaIngreso?: string;
    status?: 'valid' | 'invalid';
    error?: string;
}

export default function CargaMasivaPage() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<CausaRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{ count: number; message: string } | null>(null);
    const [pjudCreds, setPjudCreds] = useState({ rut: '', password: '' });
    const router = useRouter();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setLoading(true);
        setResult(null);

        try {
            const data = await selectedFile.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const parsed: CausaRow[] = jsonData.map((row: any) => {
                const rol = row['Rol (Ej: C-123-2024)'];
                const caratula = row['Caratula (Ej: BANCO/PEREZ)']; // Intentional mismatch handling in code logic if needed, but template uses mapping
                // Better approach: map keys flexibly or adhere strictly to template

                // Let's debug keys if needed, but assuming template structure:
                const cleanRow: CausaRow = {
                    rol: row['Rol (Ej: C-123-2024)'],
                    caratula: row['Caratula (Ej: BANCO/PEREZ)'] || row['Caratula (Ej: BANCO CHILE / GONZALEZ)'], // Handle potential template variation
                    tribunal: row['Tribunal (Ej: 1º Juzgado Civil de Santiago)'],
                    rutDeudor: row['Rut Deudor (Ej: 12.345.678-9)'],
                    nombreDeudor: row['Nombre Deudor (Opcional)'],
                    montoDemanda: row['Monto Demanda (Opcional)'],
                    fechaIngreso: row['Fecha Ingreso (YYYY-MM-DD)'],
                };

                const isValid = cleanRow.rol && cleanRow.caratula && cleanRow.tribunal;
                return {
                    ...cleanRow,
                    status: isValid ? 'valid' : 'invalid',
                    error: isValid ? undefined : 'Faltan campos obligatorios (Rol, Caratula, Tribunal)'
                };
            });

            setPreview(parsed);
        } catch (err) {
            console.error('Error parsing excel:', err);
            alert('Error al procesar el archivo Excel. Asegúrate de usar la plantilla correcta.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        const validRows = preview.filter(r => r.status === 'valid');
        if (validRows.length === 0) return;

        setUploading(true);
        try {
            // Map to DTO
            const payload = {
                causas: validRows.map(r => ({
                    rol: r.rol,
                    caratula: r.caratula,
                    tribunal: r.tribunal,
                    rutDeudor: r.rutDeudor,
                    nombreDeudor: r.nombreDeudor,
                    montoDemanda: r.montoDemanda,
                    fechaIngreso: r.fechaIngreso,
                }))
            };

            const response = await apiClient.post<{ count: number; message: string }>('/causas/bulk', payload);
            let successMessage = response.message;

            // Trigger Scraper if credentials provided
            if (pjudCreds.rut && pjudCreds.password) {
                // We send the list of Rols/Tribunals to be synced
                // Ideally, we'd use IDs, but we can sync by RIT/Tribunal
                const syncPayload = {
                    rut: pjudCreds.rut,
                    password: pjudCreds.password,
                    tasks: validRows.map(r => ({ rit: r.rol, tribunal: r.tribunal }))
                };

                // Fire and forget (or await if we want to show "Scheduled")
                // We'll use a new endpoint /scraper/batch-sync
                try {
                    await apiClient.post('/scraper/batch-sync', syncPayload);
                    successMessage += " Se ha programado la sincronización con PJUD.";
                } catch (syncErr) {
                    console.error('Sync error:', syncErr);
                    successMessage += " (Advertencia: Falló la programación del scraper).";
                }
            }

            setResult({ ...response, message: successMessage });
            setPreview([]);
            setFile(null);
        } catch (err) {
            console.error('Upload error:', err);
            alert('Error al subir las causas. Revisa la consola o intenta nuevamente.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-8 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Carga Masiva de Causas</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Sube tu planilla Excel para importar múltiples causas simultáneamente.</p>
                </div>
                <Button variant="outline" onClick={() => window.open('/templates/plantilla_carga_causas.xlsx', '_blank')}>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar Plantilla
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-lex-brand" />
                        Seleccionar Archivo
                    </CardTitle>
                    <CardDescription>
                        Selecciona el archivo Excel (.xlsx) completado con la plantilla.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                            disabled={uploading}
                            className="max-w-md cursor-pointer file:cursor-pointer file:text-lex-brand file:font-bold"
                        />
                        {loading && <Loader2 className="animate-spin h-5 w-5 text-gray-500" />}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                        <div className="col-span-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Credenciales PJUD (Opcional - Para hidratación automática)
                        </div>
                        <Input
                            placeholder="RUT (12345678-9)"
                            value={pjudCreds.rut}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPjudCreds(prev => ({ ...prev, rut: e.target.value }))}
                        />
                        <Input
                            type="password"
                            placeholder="Contraseña del Portal"
                            value={pjudCreds.password}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPjudCreds(prev => ({ ...prev, password: e.target.value }))}
                        />
                    </div>

                    {file && !loading && (
                        <div className="mt-4">
                            <Alert className={preview.find(r => r.status === 'invalid') ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'border-green-500 bg-green-50 dark:bg-green-900/20'}>
                                {preview.find(r => r.status === 'invalid') ? <AlertCircle className="h-4 w-4 text-yellow-600" /> : <CheckCircle2 className="h-4 w-4 text-green-600" />}
                                <AlertTitle>Resumen del Archivo</AlertTitle>
                                <AlertDescription>
                                    Se detectaron <strong>{preview.length}</strong> filas.
                                    <strong> {preview.filter(r => r.status === 'valid').length}</strong> válidas,
                                    <strong> {preview.filter(r => r.status === 'invalid').length}</strong> inválidas.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                </CardContent>
            </Card>

            {preview.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Vista Previa</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border max-h-[400px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Rol</TableHead>
                                        <TableHead>Caratula</TableHead>
                                        <TableHead>Tribunal</TableHead>
                                        <TableHead>Rut</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {preview.map((row, i) => (
                                        <TableRow key={i} className={row.status === 'invalid' ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                                            <TableCell>
                                                {row.status === 'valid'
                                                    ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    : <AlertCircle className="h-4 w-4 text-red-500" />
                                                }
                                            </TableCell>
                                            <TableCell className="font-medium">{row.rol || '-'}</TableCell>
                                            <TableCell>{row.caratula || '-'}</TableCell>
                                            <TableCell>{row.tribunal || '-'}</TableCell>
                                            <TableCell>{row.rutDeudor || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button
                                onClick={handleUpload}
                                size="lg"
                                disabled={uploading || preview.filter(r => r.status === 'valid').length === 0}
                                className="bg-lex-brand hover:bg-lex-brand-dark"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Cargar {preview.filter(r => r.status === 'valid').length} Causas
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {result && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20 animate-fade-in">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle>Carga Exitosa</AlertTitle>
                    <AlertDescription>
                        {result.message}
                        <div className="mt-2">
                            <Button variant="link" onClick={() => router.push('/dashboard/causas')} className="p-0 h-auto font-semibold text-green-700">
                                Ver mis causas
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
