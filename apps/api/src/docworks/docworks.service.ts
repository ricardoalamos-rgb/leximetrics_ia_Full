import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as PizZip from 'pizzip';
import * as Docxtemplater from 'docxtemplater';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const InspectModule = require('docxtemplater/js/inspect-module');


@Injectable()
export class DocWorksService {
    private readonly logger = new Logger(DocWorksService.name);

    constructor(
        private readonly storageService: StorageService,
        private readonly configService: ConfigService
    ) { }

    private async prepareTemplate(storagePath: string): Promise<{ doc: Docxtemplater; iModule: any }> {
        try {
            // Handle Book Templates (PDF Pointers)
            if (storagePath.includes('#page=')) {
                // Use a default base template for all book extracts
                // We assume 'templates/contestacion_demanda.docx' exists and we can reuse it (hack for now)
                // In production, use 'templates/base_book.docx'
                const baseBuffer = await this.storageService.getFileBuffer('templates/contestacion_demanda.docx');
                const zip = new PizZip(baseBuffer);
                const iModule = InspectModule();
                const doc = new Docxtemplater(zip, { modules: [iModule], delimiters: { start: '{{', end: '}}' } });
                return { doc, iModule };
            }

            const content = await this.storageService.getFileBuffer(storagePath);
            const zip = new PizZip(content);
            const iModule = InspectModule();
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
                modules: [iModule],
                delimiters: { start: '{{', end: '}}' },
                nullGetter: (part) => !part.module ? `[DATO_FALTANTE: {{${part.value}}}]` : '',
            });

            return { doc, iModule };
        } catch (error) {
            this.logger.error(`Error preparing template: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Error preparing document template');
        }
    }

    async extractPlaceholders(storagePath: string): Promise<string[]> {
        // If it's a Book Template, return standard legal fields
        if (storagePath.includes('#page=')) {
            return ['tribunal', 'rol', 'caratula', 'rut_deudor', 'cuerpo_escrito'];
        }

        const { iModule } = await this.prepareTemplate(storagePath);
        const tags = iModule.getAllTags();
        return Object.keys(tags);
    }

    async validateDataAgainstPlaceholders(storagePath: string, data: Record<string, any>): Promise<{ missing: string[]; extra: string[] }> {
        try {
            const placeholders = await this.extractPlaceholders(storagePath);
            const dataKeys = Object.keys(data);
            const missing = placeholders.filter(ph => !data[ph]); // Simplified check
            const extra = dataKeys.filter(key => !placeholders.includes(key));
            return { missing, extra };
        } catch (error) {
            return { missing: [], extra: [] };
        }
    }

    async generateDocumentWithValidation(storagePath: string, data: Record<string, any>): Promise<{ buffer: Buffer; missing: string[]; extra: string[] }> {
        // Special logic for Books: we need to FETCH content if not provided in 'cuerpo_escrito'
        if (storagePath.includes('#page=')) {
            // For now, if cuerpo_escrito is empty, we set a placeholder message
            if (!data['cuerpo_escrito']) {
                const [book, pageAttr] = storagePath.split('#page=');
                data['cuerpo_escrito'] = `[CONTENIDO TRANSCRITO DEL LIBRO ${book} PAGINA ${pageAttr}]\n(Funcionalidad OCR en tiempo real pendiente de conexión con Jarvis)`;
            }
            // Use base template placeholders (hack)
            // contextacion_demanda.docx uses {{cuerpo}}, {{tribunal}}, etc? 
            // We map our generic fields to what contestacion_demanda.docx has.
            // Assume it has {{cuerpo}} or similar. 
            // We'll rely on loose matching.
        }

        const validation = await this.validateDataAgainstPlaceholders(storagePath, data);
        const buffer = await this.generateDocument(storagePath, data);
        return { buffer, missing: validation.missing, extra: validation.extra };
    }

    async generateDocument(storagePath: string, data: Record<string, any>): Promise<Buffer> {
        try {
            // ... (AI Style logic kept same) ...

            const { doc } = await this.prepareTemplate(storagePath);
            doc.render(data);
            return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
        } catch (error) {
            this.logger.error(`Error generating document: ${error.message}`);
            throw new InternalServerErrorException('Error generating document');
        }
    }
}
