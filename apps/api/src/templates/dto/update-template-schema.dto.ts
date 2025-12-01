import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateTemplateSchemaDto {
    @ApiPropertyOptional({ description: 'Categoría funcional de la plantilla' })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiPropertyOptional({ description: 'Descripción amigable de la plantilla' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ type: [String], description: 'Tags libres para filtrado' })
    @IsOptional()
    @IsArray()
    tags?: string[];

    @ApiPropertyOptional({
        description: 'Esquema parametrizado de campos para DocWorks 2.0',
        type: 'object',
    })
    @IsOptional()
    @IsObject()
    paramSchema?: any;

    @ApiPropertyOptional({
        description: 'Override de estilo específico para la plantilla (opcional)',
        type: 'object',
    })
    @IsOptional()
    @IsObject()
    styleOverride?: any;
}
