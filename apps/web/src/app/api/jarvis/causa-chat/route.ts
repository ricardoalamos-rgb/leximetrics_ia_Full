import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { causaId, messages, context } = body;

        // Extract the last user message to send as the question
        // In a real chat, we might want to send the whole history, but the current backend 
        // implementation (rag_system.py) primarily takes a "question".
        // We can improve this later to handle full history if the backend supports it.
        const lastMessage = messages[messages.length - 1];
        const question = lastMessage?.content || '';

        let endpoint = `${API_URL}/jarvis/ask`;
        if (causaId) {
            endpoint = `${API_URL}/jarvis/ask/causa/${causaId}`;
        }

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${(session as any).accessToken}`,
            },
            body: JSON.stringify({
                question,
                speak: true, // Default to true or pass from frontend
            }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('[BFF Chat] Backend error:', errorText);
            return NextResponse.json(
                { error: 'Error calling Jarvis backend' },
                { status: res.status }
            );
        }

        const data = await res.json();

        // Map backend response to what JarvisChat expects
        return NextResponse.json({
            reply: data.answer,
            audio_url: data.audioUrl,
            correlation_id: data.correlationId,
            sources: data.sources
        });

    } catch (error) {
        console.error('Error in J.A.R.V.I.S. chat proxy:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
