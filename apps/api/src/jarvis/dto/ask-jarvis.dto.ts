import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AskJarvisDto {
    @ApiProperty({ description: 'Pregunta en lenguaje natural para J.A.R.V.I.S.' })
    @IsString()
    question: string;

    @ApiPropertyOptional({
        description: 'Si se debe generar también audio TTS con voz masculina Jarvis',
        default: true,
    })
    @IsBoolean()
    @IsOptional()
    speak?: boolean;
}

export class JarvisSourceDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    source_name: string;

    @ApiProperty({ required: false, nullable: true })
    score?: number | null;

    @ApiProperty({ required: false, nullable: true })
    excerpt?: string | null;
}

export class JarvisAnswerDto {
    @ApiProperty()
    answer: string;

    @ApiProperty({ type: [JarvisSourceDto] })
    sources: JarvisSourceDto[];

    @ApiProperty({ required: false, nullable: true })
    audioUrl?: string | null;

    @ApiProperty({ required: false, nullable: true })
    correlationId?: string | null;
}
