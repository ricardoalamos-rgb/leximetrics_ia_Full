import { ApiProperty } from '@nestjs/swagger';
import { EstadoCausa } from '@leximetrics/db';

export class CausaRiskSummaryDto {
    @ApiProperty()
    causaId: string;

    @ApiProperty()
    snumcaso: string; // Assuming 'rol' maps to this or similar, user asked for snumcaso but schema has 'rol'

    @ApiProperty()
    rol: string;

    @ApiProperty({ required: false })
    nombreDeudor?: string; // Not in schema yet, will be optional

    @ApiProperty({ enum: EstadoCausa })
    estado: EstadoCausa;

    @ApiProperty()
    diasSinGestion: number;

    @ApiProperty({ enum: ['VERDE', 'AMARILLO', 'ROJO'] })
    riesgoInactividad: string;

    @ApiProperty({ enum: ['BAJO', 'MEDIO', 'ALTO'] })
    riesgoProcesal: string;

    @ApiProperty({ required: false })
    fechaProximoRemate?: Date;
}
