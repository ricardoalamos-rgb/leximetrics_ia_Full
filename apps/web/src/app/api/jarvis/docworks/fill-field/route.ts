import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const JARVIS_API_URL =
    process.env.JARVIS_BACKEND_URL || 'http://localhost:8004';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { error: 'Invalid JSON body' },
            { status: 400 },
        );
    }

    const { field, values, style, templateName, templateCategory } = body ?? {};

    if (!field?.key || !field?.label) {
        return NextResponse.json(
            { error: 'Missing field information' },
            { status: 400 },
        );
    }

    // Estilo del estudio
    const styleName = style?.name || 'Estudio jurídico';
    const writingStyle = style?.writingStyle || {};
    const tone = writingStyle.tone || 'formal-profesional';
    const voice = writingStyle.voice || 'plural corporativo';
    const region = writingStyle.region || 'Chile';
    const extraInstructions =
        writingStyle.extraInstructions ||
        'Usa lenguaje claro y preciso en derecho chileno.';

    // Resumimos algunos otros campos ya capturados
    const otherFieldsLines: string[] = [];
    if (values && typeof values === 'object') {
        Object.entries(values).forEach(([key, val]) => {
            if (!val) return;
            if (key === field.key) return; // saltamos el propio campo
            if (String(val).trim().length === 0) return;
            otherFieldsLines.push(`- ${key}: ${val}`);
        });
    }

    const otherFieldsBlock =
        otherFieldsLines.length > 0
            ? `Otros datos ya completados del formulario:\n${otherFieldsLines.join(
                '\n',
            )}\n\n`
            : '';

    // Hint específico del campo
    const aiHint = field.aiHint || '';
    const templateInfo = templateName
        ? `La plantilla se llama "${templateName}"${templateCategory ? ` y corresponde a la categoría "${templateCategory}".` : '.'
        }`
        : '';

    const userName = session.user.name || 'abogado/a del estudio';

    const question = `
Eres J.A.R.V.I.S., asistente jurídico especializado en Derecho Chileno.

Actúa como redactor legal del estudio "${styleName}". Debes redactar un párrafo (o varios párrafos breves y bien estructurados) para completar el campo:

- Campo: "${field.label}" (key: ${field.key})
- Contexto: ${aiHint || 'Campo de un escrito judicial o contrato.'}
- Uso: Este texto será pegado directamente en la plantilla DocWorks del estudio. ${templateInfo}

Estilo requerido:
- Tono: ${tone}
- Voz: ${voice}
- Región: ${region}
- Instrucciones adicionales: ${extraInstructions}

${otherFieldsBlock}Instrucciones de salida IMPORTANTES:
- Escribe solo el texto del campo, sin encabezados, sin saludos, sin explicaciones meta.
- No expliques qué estás haciendo; solo entrega el contenido final.
- Si es necesario citar normas o jurisprudencia, hazlo en estilo claro pero sin notas al pie.
- El texto debe estar listo para copiar/pegar en el documento final.
`;

    try {
        const res = await fetch(`${JARVIS_API_URL}/jarvis/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question,
                enable_tts: false,
            }),
        });

        const text = await res.text();
        if (!res.ok) {
            console.error('[JARVIS fill-field] backend error:', text);
            return NextResponse.json(
                { error: 'Error al pedir sugerencia a JARVIS' },
                { status: 500 },
            );
        }

        const data = text ? JSON.parse(text) : {};
        const answer: string = (data.answer || '').toString();

        return NextResponse.json({
            suggestion: answer.trim(),
        });
    } catch (error: any) {
        console.error('[JARVIS fill-field] fetch error:', error);
        return NextResponse.json(
            { error: 'Error de conexión con JARVIS' },
            { status: 500 },
        );
    }
}
