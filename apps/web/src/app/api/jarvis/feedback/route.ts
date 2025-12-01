import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { correlationId, useful, comment } = body;

        const res = await fetch(`${API_URL}/jarvis/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${(session as any).accessToken}`,
            },
            body: JSON.stringify({ correlationId, useful, comment }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('[BFF Feedback] error:', errorText);
            return NextResponse.json(
                { error: 'Error enviando feedback' },
                { status: res.status },
            );
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error: any) {
        console.error('[BFF Feedback] fetch error:', error);
        return NextResponse.json(
            { error: 'Error de conexión con API' },
            { status: 500 },
        );
    }
}
