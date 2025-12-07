import { NextRequest, NextResponse } from 'next/server';

const JARVIS_API_URL =
    process.env.JARVIS_BACKEND_URL || 'http://localhost:8004';

export async function GET(_req: NextRequest) {
    try {
        const res = await fetch(`${JARVIS_API_URL}/telemetry/indexing`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const text = await res.text();

        if (!res.ok) {
            console.error('[JARVIS indexing] backend error:', text);
            return NextResponse.json(
                { error: 'Error consultando estado de indexación' },
                { status: 500 },
            );
        }

        const data = text ? JSON.parse(text) : {};
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[JARVIS indexing] fetch error:', error);
        return NextResponse.json(
            { error: 'Error de conexión con JARVIS' },
            { status: 500 },
        );
    }
}
