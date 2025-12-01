import { ApiProperty } from '@nestjs/swagger';

export class HomeCausaRojaDto {
    @ApiProperty()
    causaId: string;

    @ApiProperty()
    snumcaso: string;

    @ApiProperty({ required: false })
    nombreDeudor?: string | null;

    @ApiProperty()
    riesgoInactividad: string;

    @ApiProperty()
    riesgoProcesal: string;
}

export class HomeRemateProximoDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    causaId: string;

    @ApiProperty()
    fechaRemate: Date;

    @ApiProperty({ required: false })
    rol?: string | null;

    @ApiProperty({ required: false })
    snumcaso?: string | null;

    @ApiProperty({ required: false })
    nombreDeudor?: string | null;
}

export class HomeResponseDto {
    @ApiProperty({ type: [HomeCausaRojaDto] })
    causasEnRojo: HomeCausaRojaDto[];

    @ApiProperty({ type: [HomeRemateProximoDto] })
    rematesProximos: HomeRemateProximoDto[];
}
