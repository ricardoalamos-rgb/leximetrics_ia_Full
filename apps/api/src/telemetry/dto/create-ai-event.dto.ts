import { AiFeatureType } from '@leximetrics/db';
import {
    IsBoolean,
    IsEnum,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
} from 'class-validator';

export class CreateAiEventDto {
    @IsEnum(AiFeatureType)
    feature: AiFeatureType;

    @IsOptional()
    @IsString()
    provider?: string;

    @IsOptional()
    @IsString()
    modelName?: string;

    @IsBoolean()
    success: boolean;

    @IsOptional()
    @IsString()
    errorCode?: string;

    @IsOptional()
    @IsString()
    errorMessage?: string;

    @IsOptional()
    @IsNumber()
    latencyMs?: number;

    @IsOptional()
    @IsNumber()
    inputTokens?: number;

    @IsOptional()
    @IsNumber()
    outputTokens?: number;

    @IsOptional()
    @IsNumber()
    totalTokens?: number;

    @IsOptional()
    @IsNumber()
    inputCostUsd?: number;

    @IsOptional()
    @IsNumber()
    outputCostUsd?: number;

    @IsOptional()
    @IsNumber()
    totalCostUsd?: number;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}
