import { IsString, IsNotEmpty, IsOptional, IsInt, IsNumber, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTelemetryEventDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    feature: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    action: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    correlationId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    durationMs?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    tokensInput?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    tokensOutput?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    costUsd?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsObject()
    meta?: Record<string, any>;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    error?: string;
}
