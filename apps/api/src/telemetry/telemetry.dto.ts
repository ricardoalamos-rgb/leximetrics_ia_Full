import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, IsObject } from 'class-validator';
import { AiProvider, TelemetryFeature } from '@leximetrics/db';

export class CreateAiUsageEventDto {
    @ApiProperty({ enum: TelemetryFeature })
    @IsEnum(TelemetryFeature)
    feature: TelemetryFeature;

    @ApiProperty({ enum: AiProvider })
    @IsEnum(AiProvider)
    provider: AiProvider;

    @ApiProperty()
    @IsString()
    model: string;

    @ApiProperty()
    @IsInt()
    tokensPrompt: number;

    @ApiProperty()
    @IsInt()
    tokensCompletion: number;

    @ApiProperty()
    @IsInt()
    tokensTotal: number;

    @ApiProperty()
    @IsNumber()
    costUsd: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    latencyMs?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    correlationId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    source?: string;

    @ApiPropertyOptional({ description: 'Tenant ID (cuando la llamada viene de un servicio interno)' })
    @IsOptional()
    @IsString()
    tenantId?: string;

    @ApiPropertyOptional({ description: 'User ID (cuando se conoce el usuario final)' })
    @IsOptional()
    @IsString()
    userId?: string;

    @ApiPropertyOptional({ description: 'Payload adicional (ruta, featureName, etc.)' })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}

export class UsageSummaryResponseDto {
    @ApiProperty()
    from: string;

    @ApiProperty()
    to: string;

    @ApiProperty()
    totalTokens: number;

    @ApiProperty()
    totalCostUsd: number;

    @ApiProperty({
        description: 'Uso agrupado por usuario',
        type: 'object',
        isArray: true,
    })
    byUser: {
        userId: string | null;
        totalTokens: number;
        totalCostUsd: number;
    }[];

    @ApiProperty({
        description: 'Uso agrupado por feature',
        type: 'object',
        isArray: true,
    })
    byFeature: {
        feature: TelemetryFeature;
        totalTokens: number;
        totalCostUsd: number;
    }[];

    @ApiProperty({
        description: 'Serie diaria de uso',
        type: 'object',
        isArray: true,
    })
    daily: {
        date: string;
        totalTokens: number;
        totalCostUsd: number;
    }[];
}
