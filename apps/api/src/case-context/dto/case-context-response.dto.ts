import { ApiProperty } from '@nestjs/swagger';
import { EstadoCausa, DocumentType } from '@leximetrics/db';

export class CausaContextDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    rol: string;

    @ApiProperty()
    caratula: string;

    @ApiProperty()
    tribunal: string;

    @ApiProperty({ enum: EstadoCausa })
    estado: EstadoCausa;

    @ApiProperty()
    createdAt: Date;
}

export class GestionContextDto {
    @ApiProperty()
    fecha: Date;

    @ApiProperty()
    descripcion: string;

    @ApiProperty()
    tipo: string; // Derived or raw
}

export class RemateContextDto {
    @ApiProperty()
    fechaRemate: Date;

    @ApiProperty({ required: false })
    minimo?: number;

    @ApiProperty({ required: false })
    garantia?: number;
}

export class DocumentoContextDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    nombre: string;

    @ApiProperty({ enum: DocumentType })
    tipo: DocumentType;

    @ApiProperty()
    url: string;

    @ApiProperty()
    createdAt: Date;
}

export class IndicadoresRiesgoDto {
    @ApiProperty()
    diasSinGestion: number;

    @ApiProperty({ enum: ['VERDE', 'AMARILLO', 'ROJO'] })
    riesgoInactividad: string;

    @ApiProperty()
    etapaProcesal: string;
}

export class TimelineEventoDto {
    @ApiProperty({ enum: ['GESTION', 'REMATE', 'DOCUMENTO'] })
    tipo: string;

    @ApiProperty()
    fecha: Date;

    @ApiProperty()
    resumen: string;

    @ApiProperty({ type: 'object', additionalProperties: true })
    meta: any;
}

export class CaseContextResponseDto {
    @ApiProperty({ type: CausaContextDto })
    causa: CausaContextDto;

    @ApiProperty({ type: [GestionContextDto] })
    gestiones: GestionContextDto[];

    @ApiProperty({ type: [RemateContextDto] })
    remates: RemateContextDto[];

    @ApiProperty({ type: [DocumentoContextDto] })
    documentosClave: DocumentoContextDto[];

    @ApiProperty({ type: IndicadoresRiesgoDto })
    indicadoresRiesgo: IndicadoresRiesgoDto;

    @ApiProperty({ type: [TimelineEventoDto] })
    timelineEventos: TimelineEventoDto[];
}
