import { IsBoolean, IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatMessageDto {
    @ApiProperty()
    @IsString()
    role: 'user' | 'assistant';

    @ApiProperty()
    @IsString()
    content: string;
}

export class AskJarvisDto {
    @ApiProperty({ description: 'Pregunta en lenguaje natural (Legacy)' })
    @IsString()
    @IsOptional()
    question?: string;

    @ApiProperty({ description: 'Historial de chat', type: [ChatMessageDto] })
    @IsOptional()
    @IsArray()
    messages?: ChatMessageDto[];

    @ApiPropertyOptional({ description: 'Contexto adicional (causa, cliente, etc)' })
    @IsOptional()
    context?: any;

    @ApiPropertyOptional({ description: 'ID de la Causa vinculada' })
    @IsOptional()
    @IsString()
    causaId?: string;

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
