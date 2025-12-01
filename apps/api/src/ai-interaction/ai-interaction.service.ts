import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogInteractionDto } from './dto/log-interaction.dto';
import { AiInteraction } from '@leximetrics/db';

@Injectable()
export class AiInteractionService {
    constructor(private readonly prisma: PrismaService) { }

    async logInteraction(tenantId: string, userId: string, dto: LogInteractionDto): Promise<AiInteraction> {
        return this.prisma.aiInteraction.create({
            data: {
                tenantId,
                userId,
                origen: dto.origen,
                inputSummary: dto.inputSummary,
                rawInput: dto.rawInput || {},
                rawOutput: dto.rawOutput || {},
                aceptadaPorUsuario: dto.aceptadaPorUsuario,
                notasUsuario: dto.notasUsuario,
            },
        });
    }
}
