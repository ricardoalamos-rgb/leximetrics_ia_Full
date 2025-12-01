import { Controller, Get, Post, Param, Body, Res, UseGuards, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { DocWorksService } from './docworks.service';
import { TemplatesService } from '../templates/templates.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DocumentType } from '@leximetrics/db';

@ApiTags('Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('templates')
export class TemplatesController {
    constructor(
        private readonly docWorksService: DocWorksService,
        private readonly templatesService: TemplatesService,
        private readonly prisma: PrismaService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'List available templates' })
    async findAll(@CurrentUser('tenantId') tenantId: string) {
        // Assuming templates are stored as Documents with a specific type or metadata
        // For now, let's assume DocumentType.OTRO or a new type TEMPLATE if we had it.
        // Or we can filter by a naming convention or a specific folder in storage.
        // Let's query documents that might be templates.
        // Ideally, we should have DocumentType.TEMPLATE.
        // For this sprint, let's list all documents and let frontend filter, or filter by type if possible.
        // Let's assume we use DocumentType.OTRO for now as generic, or maybe we added TEMPLATE to schema?
        // Checking schema... DocumentType has ESCRITO, DEMANDA, RESOLUCION, NOTIFICACION, OTRO.
        // Let's use OTRO for now, or maybe we should add TEMPLATE to schema later.

        return this.prisma.documento.findMany({
            where: {
                tenantId,
                // type: DocumentType.TEMPLATE, // If we had it
            },
        });
    }

    @Get(':id/placeholders')
    @ApiOperation({ summary: 'Extract placeholders from a template' })
    async getPlaceholders(
        @Param('id') id: string,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        const document = await this.prisma.documento.findUnique({
            where: { id },
        });

        if (!document || document.tenantId !== tenantId) {
            throw new NotFoundException('Template not found');
        }

        // Assuming document.url stores the relative path in storage (e.g., "tenantId/uuid.docx")
        // If it stores full URL, we need to parse it. StorageService returns "tenantId/uuid.ext".
        // Let's assume document.url holds the key.

        return this.docWorksService.extractPlaceholders(document.url);
    }

    @Post(':id/generate')
    @ApiOperation({ summary: 'Generate a document from a template' })
    @ApiBody({ schema: { type: 'object', additionalProperties: true } })
    async generate(
        @Param('id') id: string,
        @Body() data: Record<string, any>,
        @CurrentUser('tenantId') tenantId: string,
        @Res() res: Response,
    ) {
        const { buffer, fileName } = await this.templatesService.generateFromTemplate(id, data, tenantId);

        const filename = fileName;

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
            'Content-Length': buffer.length,
        });

        res.send(buffer);
    }
}
