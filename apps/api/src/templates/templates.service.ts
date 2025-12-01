import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DocWorksService } from '../docworks/docworks.service';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentType } from '@leximetrics/db';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class TemplatesService {
    private readonly logger = new Logger(TemplatesService.name);

    constructor(
        private readonly docWorksService: DocWorksService,
        private readonly prisma: PrismaService,
        private readonly storageService: StorageService,
    ) { }

    async uploadTemplate(
        file: Express.Multer.File,
        name: string,
        type: DocumentType,
        tenantId: string,
    ): Promise<any> {
        const storagePath = await this.storageService.upload(file, tenantId);

        try {
            const placeholders = await this.docWorksService.extractPlaceholders(storagePath);

            const baseParamSchema = this.buildDefaultParamSchema(placeholders);

            const template = await this.prisma.template.create({
                data: {
                    tenantId,
                    name,
                    type,
                    storagePath,
                    placeholders: placeholders as any,
                    category: 'General',
                    description: `Plantilla generada automáticamente para ${name}`,
                    tags: [],
                    paramSchema: baseParamSchema,
                },
            });

            return template;
        } catch (error) {
            this.logger.error(`Error uploading template: ${error.message}`, error.stack);
            throw error;
        }
    }

    private buildDefaultParamSchema(placeholders: string[]) {
        return {
            version: 1,
            groups: [
                { id: 'general', label: 'Datos Generales', icon: 'file-text' },
            ],
            fields: placeholders.map((ph) => ({
                key: ph,
                label: ph.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                type: 'text',
                group: 'general',
                required: true,
                aiEnabled: true,
            })),
        };
    }

    async findOne(id: string, tenantId: string): Promise<any> {
        const template = await this.prisma.template.findUnique({
            where: { id },
        });

        if (!template || template.tenantId !== tenantId) {
            throw new NotFoundException(`Template with ID ${id} not found`);
        }

        return template;
    }

    async updateTemplateSchema(
        id: string,
        tenantId: string,
        data: {
            category?: string;
            description?: string;
            tags?: string[];
            paramSchema?: any;
            styleOverride?: any;
        },
    ): Promise<any> {
        const template = await this.findOne(id, tenantId);

        return this.prisma.template.update({
            where: { id: template.id },
            data: {
                category: data.category ?? template.category,
                description: data.description ?? template.description,
                tags: data.tags ?? template.tags,
                paramSchema: data.paramSchema ?? template.paramSchema,
                styleOverride: data.styleOverride ?? template.styleOverride,
            },
        });
    }

    async generateFromTemplate(id: string, data: Record<string, any>, tenantId: string): Promise<{ buffer: Buffer; fileName: string }> {
        const template = await this.findOne(id, tenantId);

        // Use wrapper 2.0
        const { buffer, missing, extra } = await this.docWorksService.generateDocumentWithValidation(template.storagePath, data);

        // TODO DocWorks 2.0: exponer missing/extra via API o Telemetría AI
        // const validationResult = { missing, extra };

        this.logger.log(`Generated document for template ${template.id} (tenant: ${tenantId}). Missing: ${missing.length}, Extra: ${extra.length}`);

        const fileName = `generated_${template.name}`;

        return { buffer, fileName };
    }
}
