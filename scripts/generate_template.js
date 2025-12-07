const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const outputDir = path.join(__dirname, '../apps/web/public/templates');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const headers = [
    'Rol (Ej: C-123-2024)',
    'Caratula (Ej: BANCO/PEREZ)',
    'Tribunal (Ej: 1º Juzgado Civil de Santiago)',
    'Rut Deudor (Ej: 12.345.678-9)',
    'Nombre Deudor (Opcional)',
    'Monto Demanda (Opcional)',
    'Fecha Ingreso (YYYY-MM-DD)'
];

const sampleData = [
    {
        'Rol (Ej: C-123-2024)': 'C-1234-2024',
        'Caratula (Ej: BANCO CHILE / GONZALEZ)': 'BANCO CHILE / GONZALEZ',
        'Tribunal (Ej: 1º Juzgado Civil de Santiago)': '1º Juzgado Civil de Santiago',
        'Rut Deudor (Ej: 12.345.678-9)': '11.111.111-1',
        'Nombre Deudor (Opcional)': 'JUAN GONZALEZ',
        'Monto Demanda (Opcional)': 5000000,
        'Fecha Ingreso (YYYY-MM-DD)': '2024-01-15'
    },
    {
        'Rol (Ej: C-123-2024)': 'C-5678-2023',
        'Caratula (Ej: SCOTIABANK / TAPIA)': 'SCOTIABANK / TAPIA',
        'Tribunal (Ej: 1º Juzgado Civil de Santiago)': '2º Juzgado Civil de Santiago',
        'Rut Deudor (Ej: 12.345.678-9)': '22.222.222-2',
        'Nombre Deudor (Opcional)': 'MARIA TAPIA',
        'Monto Demanda (Opcional)': 1250000,
        'Fecha Ingreso (YYYY-MM-DD)': '2023-11-20'
    }
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });

// Adjust column width
const wscols = [
    { wch: 20 }, // Rol
    { wch: 30 }, // Caratula
    { wch: 30 }, // Tribunal
    { wch: 20 }, // Rut
    { wch: 25 }, // Nombre
    { wch: 15 }, // Monto
    { wch: 20 }, // Fecha
];
ws['!cols'] = wscols;

XLSX.utils.book_append_sheet(wb, ws, 'Causas');

const outputPath = path.join(outputDir, 'plantilla_carga_causas.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`Template generated at: ${outputPath}`);
