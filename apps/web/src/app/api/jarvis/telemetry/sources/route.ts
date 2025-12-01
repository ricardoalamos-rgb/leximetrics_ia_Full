import { NextRequest, NextResponse } from 'next/server';

const JARVIS_API_URL =
    process.env.JARVIS_BACKEND_URL || 'http://localhost:8004';

export async function GET(_req: NextRequest) {
    try {
        const res = await fetch(`${JARVIS_API_URL}/telemetry/sources`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            // Si luego agregas auth en JARVIS, aquí se inyecta el token/API key
        });

        const text = await res.text();

        if (!res.ok) {
            console.error('[JARVIS telemetry] backend error:', text);
            return NextResponse.json(
                { error: 'Error consultando telemetría de JARVIS' },
                { status: 500 },
            );
        }

        const data = text ? JSON.parse(text) : [];
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[JARVIS telemetry] fetch error:', error);
        return NextResponse.json(
            { error: 'Error de conexión con JARVIS' },
            { status: 500 },
        );
    }
}
