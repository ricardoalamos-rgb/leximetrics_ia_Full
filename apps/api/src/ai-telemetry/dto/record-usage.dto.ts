import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordUsageDto {
  @ApiProperty({ description: 'Identificador lógico de la feature', example: 'DOCWORKS_FILL_FIELD' })
  @IsString()
  feature: string;

  @ApiProperty({ description: 'Proveedor IA', example: 'google' })
  @IsString()
  provider: string;

  @ApiProperty({ description: 'Modelo IA', example: 'gemini-2.0-flash' })
  @IsString()
  model: string;

  @ApiPropertyOptional({ description: 'Tokens de entrada' })
  @IsNumber()
  @IsOptional()
  tokensInput?: number;

  @ApiPropertyOptional({ description: 'Tokens de salida' })
  @IsNumber()
  @IsOptional()
  tokensOutput?: number;

  @ApiPropertyOptional({ description: 'Costo en USD' })
  @IsNumber()
  @IsOptional()
  costUsd?: number;

  @ApiPropertyOptional({ description: 'Latencia total (ms)' })
  @IsNumber()
  @IsOptional()
  latencyMs?: number;

  @ApiPropertyOptional({ description: '¿La operación fue exitosa?', default: true })
  @IsBoolean()
  @IsOptional()
  success?: boolean = true;

  @ApiPropertyOptional({ description: 'Código de error, si aplica' })
  @IsString()
  @IsOptional()
  errorCode?: string;

  @ApiPropertyOptional({ description: 'Metadata adicional (JSON stringifiable)' })
  @IsOptional()
  meta?: any;
}
