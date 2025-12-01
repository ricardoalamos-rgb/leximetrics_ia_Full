import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGestionDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    descripcion: string;

    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    causaId: string;

    // @ApiProperty({ required: false })
    // @IsOptional()
    // @IsUUID()
    // cuadernoId?: string; // Uncomment when Cuaderno model is added
}
