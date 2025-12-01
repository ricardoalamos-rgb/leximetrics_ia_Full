import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '@leximetrics/db';

export class CreateDocumentoDto {
    @ApiProperty({ enum: DocumentType })
    @IsEnum(DocumentType)
    @IsNotEmpty()
    type: DocumentType;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    causaId?: string;

    // @ApiProperty({ required: false })
    // @IsOptional()
    // @IsString()
    // nota?: string;
}
