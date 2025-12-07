import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TemplatesService } from './templates.service';
import { UpdateTemplateSchemaDto } from './dto/update-template-schema.dto';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@leximetrics/db';

@ApiTags('Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('templates')
export class TemplatesController {
    constructor(private readonly templatesService: TemplatesService) { }

    @Get(':id/schema')
    @Roles(UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'Obtener esquema parametrizado de una plantilla (DocWorks 2.0)' })
    async getSchema(
        @Param('id') id: string,
        @CurrentUser('tenantId') tenantId: string,
    ): Promise<any> {
        const template = await this.templatesService.findOne(id, tenantId);
        return {
            id: template.id,
            name: template.name,
            category: template.category,
            description: template.description,
            tags: template.tags,
            placeholders: template.placeholders,
            paramSchema: template.paramSchema,
            styleOverride: template.styleOverride,
        };
    }

    @Get(':id/placeholders')
    @Roles(UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'Obtener placeholders de una plantilla' })
    async getPlaceholders(
        @Param('id') id: string,
        @CurrentUser('tenantId') tenantId: string,
    ): Promise<string[]> {
        const template = await this.templatesService.findOne(id, tenantId);
        return (template.placeholders as string[]) || [];
    }

    @Patch(':id/schema')
    @Roles(UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'Actualizar esquema parametrizado y metadatos de plantilla' })
    async updateSchema(
        @Param('id') id: string,
        @Body() dto: UpdateTemplateSchemaDto,
        @CurrentUser('tenantId') tenantId: string,
    ): Promise<any> {
        return this.templatesService.updateTemplateSchema(id, tenantId, dto);
    }
}
