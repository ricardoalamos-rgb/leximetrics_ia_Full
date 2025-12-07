import { Controller, Get, Post, Param, Body, Res, UseGuards, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { DocWorksService } from './docworks.service';
import { TemplatesService } from '../templates/templates.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DocumentType, Template } from '@leximetrics/db';

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
    async findAll(@CurrentUser('tenantId') tenantId: string): Promise<any[]> {
        const templates = await this.prisma.template.findMany({
            where: {
                tenantId,
            },
        });

        // Map to expected Documento-like interface for frontend compatibility
        return templates.map(t => ({
            id: t.id,
            nombre: t.name, // Frontend expects 'nombre'
            tipo: t.type,
            url: t.storagePath, // Frontend uses 'url' or 'storagePath'
            category: t.category,
            description: t.description,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
            tenantId: t.tenantId,
            // Param schema for DocWorks 2.0
            paramSchema: t.paramSchema,
        }));
    }

    @Get(':id/placeholders')
    @ApiOperation({ summary: 'Extract placeholders from a template' })
    async getPlaceholders(
        @Param('id') id: string,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        const template = await this.prisma.template.findUnique({
            where: { id },
        });

        if (!template || template.tenantId !== tenantId) {
            throw new NotFoundException('Template not found');
        }

        // Use storagePath
        return this.docWorksService.extractPlaceholders(template.storagePath);
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
