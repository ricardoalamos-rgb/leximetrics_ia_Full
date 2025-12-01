import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class JarvisService {
    private readonly logger = new Logger(JarvisService.name);
    private readonly baseUrl: string;

    constructor() {
        this.baseUrl =
            process.env.JARVIS_BACKEND_URL?.replace(/\/+$/, '') ??
            'http://localhost:8000';
    }

    async ask(question: string, tenantId: string, userId: string) {
        // Existing method if any, or placeholder
        // Assuming this was already implemented or similar
        return {};
    }

    async askForCausa(params: {
        question: string;
        causaId: string;
        tenantId: string;
        userId?: string;
    }) {
        const url = `${this.baseUrl}/ask-causa`;
        try {
            const resp = await axios.post(url, params, {
                timeout: 30000,
            });
            return resp.data;
        } catch (error: any) {
            this.logger.error(`Error llamando a JARVIS backend: ${error?.message}`, error?.stack);
            // Fallback or rethrow
            if (error.response) {
                throw new InternalServerErrorException(
                    `JARVIS Error: ${error.response.data?.detail || error.message}`
                );
            }
            throw new InternalServerErrorException(
                'No fue posible obtener respuesta de JARVIS.',
            );
        }
    }
}
