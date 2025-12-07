import { IsString, IsOptional, IsNumber, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCausaDto {
    @ApiProperty()
    @IsString()
    rol: string;

    @ApiProperty()
    @IsString()
    caratula: string;

    @ApiProperty()
    @IsString()
    tribunal: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    rutDeudor?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    nombreDeudor?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    montoDemanda?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    fechaIngreso?: string;
}

export class BulkCreateCausaDto {
    @ApiProperty({ type: [CreateCausaDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateCausaDto)
    causas: CreateCausaDto[];
}
