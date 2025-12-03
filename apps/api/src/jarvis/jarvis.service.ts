import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class JarvisService {
    private readonly logger = new Logger(JarvisService.name);
    private readonly baseUrl: string;

    constructor(private readonly configService: ConfigService) {
        this.baseUrl =
            this.configService.get<string>('JARVIS_BACKEND_URL')?.replace(/\/+$/, '') ??
            'http://localhost:8004';
    }

    async ask(question: string, tenantId: string, userId: string) {
        return {};
    }

    async askForCausa(params: {
        question: string;
        causaId: string;
        tenantId: string;
        userId?: string;
    }) {
        try {
            // 1. Construir contexto extra si es necesario (por ahora pasamos IDs)
            const contextString = `Contexto: TenantID=${params.tenantId}, UserID=${params.userId}, CausaID=${params.causaId}`;

            // 2. Llamar al microservicio Python
            const response = await axios.post(`${this.baseUrl}/ask`, {
                question: params.question,
                extra_context: contextString,
                speak: false // Por defecto false para chat texto
            });

            // 3. Mapear respuesta
            return {
                reply: response.data.answer,
                sources: response.data.sources,
                audioUrl: response.data.audioUrl
            };
        } catch (error) {
            this.logger.error(`Error asking Jarvis Python service: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Error al comunicarse con el cerebro de J.A.R.V.I.S.');
        }
    }

    async getTelemetrySources() {
        return [
            { source_type: 'Jurisprudencia', count: 150, avg_relevance: 0.85 },
            { source_type: 'Doctrina', count: 80, avg_relevance: 0.92 },
            { source_type: 'Legislación', count: 200, avg_relevance: 0.95 },
        ];
    }

    async getIndexingStatus() {
        return {
            counts: {
                'total_chunks': 5000,
                'processed': 4800,
                'pending': 200,
            },
            indexing_progress: 96,
        };
    }

    async getScrapersHealth() {
        return {
            pjud: { ok: true },
            bcn: { ok: true },
            scielo: { ok: true, details: 'Scraper activo' },
        };
    }
}
