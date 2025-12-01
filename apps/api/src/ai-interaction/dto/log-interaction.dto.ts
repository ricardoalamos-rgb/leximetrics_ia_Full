import { IsString, IsOptional, IsJSON, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogInteractionDto {
    @ApiProperty()
    @IsString()
    origen: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    inputSummary?: string;

    @ApiProperty({ required: false })
    @IsObject()
    @IsOptional()
    rawInput?: any;

    @ApiProperty({ required: false })
    @IsObject()
    @IsOptional()
    rawOutput?: any;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    aceptadaPorUsuario?: boolean;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    notasUsuario?: string;
}
