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
            const content = await this.storageService.getFileBuffer(storagePath);
            const zip = new PizZip(content);

            const iModule = InspectModule();

            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
                modules: [iModule],
                delimiters: { start: '{{', end: '}}' },
                nullGetter: (part) => {
                    if (!part.module) {
                        return `[DATO_FALTANTE: {{${part.value}}}]`;
                    }
                    if (part.module === 'rawxml') {
                        return '';
                    }
                    return '';
                },
            });

            return { doc, iModule };
        } catch (error) {
            this.logger.error(`Error preparing template: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Error preparing document template');
        }
    }

    async extractPlaceholders(storagePath: string): Promise<string[]> {
        const { iModule } = await this.prepareTemplate(storagePath);
        const tags = iModule.getAllTags();
        // Filter unique tags and return keys
        return Object.keys(tags);
    }

    async validateDataAgainstPlaceholders(
        storagePath: string,
        data: Record<string, any>
    ): Promise<{ missing: string[]; extra: string[] }> {
        try {
            const placeholders = await this.extractPlaceholders(storagePath);
            const dataKeys = Object.keys(data);

            const missing = placeholders.filter(ph => data[ph] === undefined || data[ph] === null || data[ph] === '');
            const extra = dataKeys.filter(key => !placeholders.includes(key));

            return { missing, extra };
        } catch (error) {
            this.logger.error(`Error validating data: ${error.message}`, error.stack);
            // Return empty validation instead of crashing if extraction fails, or rethrow?
            // Prompt says "No lanza excepción; solo devuelve el resultado."
            // But if extractPlaceholders fails (e.g. file not found), it throws.
            // Let's catch and return empty arrays or rethrow if it's critical.
            // Given "No lanza excepción", we'll return empty arrays but log error.
            return { missing: [], extra: [] };
        }
    }

    async generateDocumentWithValidation(
        storagePath: string,
        data: Record<string, any>
    ): Promise<{ buffer: Buffer; missing: string[]; extra: string[] }> {
        const validation = await this.validateDataAgainstPlaceholders(storagePath, data);

        this.logger.log(
            `Generating document with validation: path=${storagePath}, ` +
            `missing=${validation.missing.length}, extra=${validation.extra.length}`
        );

        const buffer = await this.generateDocument(storagePath, data);

        return {
            buffer,
            missing: validation.missing,
            extra: validation.extra
        };
    }

    async generateDocument(storagePath: string, data: Record<string, any>): Promise<Buffer> {
        try {
            this.logger.log(`Starting document generation for: ${storagePath}`);
            this.logger.log(`Data keys provided: ${Object.keys(data).length}`);

            // AI Style Generation Integration
            if (data.perfilEstilo && data.tipoDocumento) {
                try {
                    const aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:8000';
                    const response = await axios.post(`${aiServiceUrl}/style/generate-text`, {
                        perfilEstilo: data.perfilEstilo,
                        tipoDocumento: data.tipoDocumento,
                        datosEstructurados: data
                    });

                    if (response.data && response.data.secciones) {
                        this.logger.log('Applied AI style generation to document');
                        // Merge generated sections into data
                        data = { ...data, ...response.data.secciones };
                    }
                } catch (aiError) {
                    this.logger.warn(`Failed to generate styled text: ${aiError.message}`);
                    // Continue without styled text, falling back to templates/defaults
                }
            }

            const { doc } = await this.prepareTemplate(storagePath);

            doc.render(data);

            const buf = doc.getZip().generate({
                type: 'nodebuffer',
                compression: 'DEFLATE',
            });

            this.logger.log(`Document generated successfully: ${storagePath}`);
            return buf;
        } catch (error) {
            this.logger.error(`Error generating document: ${error.message}`, error.stack);
            if (error.properties && error.properties.errors) {
                const errorMessages = error.properties.errors
                    .map((e: any) => e.properties.explanation)
                    .join(', ');
                this.logger.error(`Docxtemplater errors: ${errorMessages}`);
            }
            throw new InternalServerErrorException('Error generating document from template');
        }
    }
}
