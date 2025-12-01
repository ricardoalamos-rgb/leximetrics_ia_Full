import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EstadoCausa } from '@leximetrics/db';

@Injectable()
export class CausaRiskService {
    constructor(private prisma: PrismaService) { }

    async evaluateRisk(causaId: string, tenantId: string): Promise<{
        score: number;
        label: 'BAJO' | 'MEDIO' | 'ALTO';
        reasons: string[];
    }> {
        const causa = await this.prisma.causa.findUnique({
            where: { id: causaId },
        });

        if (!causa) {
            throw new NotFoundException('Causa no encontrada');
        }

        if (causa.tenantId !== tenantId) {
            throw new ForbiddenException('No tienes permiso para ver esta causa');
        }

        let score = 0;
        const reasons: string[] = [];

        // 1. Antigüedad desde ultimaGestion
        if (causa.ultimaGestion) {
            const daysSince = Math.floor((Date.now() - causa.ultimaGestion.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSince > 30) {
                score += 0.3;
                reasons.push(`Más de 30 días sin gestión (${daysSince} días)`);
            } else if (daysSince > 15) {
                score += 0.1;
                reasons.push(`Más de 15 días sin gestión (${daysSince} días)`);
            }
        } else {
            // Si no hay última gestión, asumimos riesgo si la causa es antigua, pero por ahora sumamos algo por defecto
            score += 0.2;
            reasons.push('Sin gestiones registradas');
        }

        // 2. Estado
        const criticalStates: EstadoCausa[] = [EstadoCausa.SIN_DEMANDA, EstadoCausa.SIN_NOTIFICAR, EstadoCausa.ETAPA_REMATE];
        if (criticalStates.includes(causa.estado)) {
            score += 0.4;
            reasons.push(`Estado crítico: ${causa.estado}`);
        }

        // 3. Monto de demanda (ejemplo simple: > 10.000.000)
        if (causa.montoDemanda && causa.montoDemanda > 10000000) {
            score += 0.2;
            reasons.push('Monto de demanda alto (> 10M)');
        }

        // Cap score at 1
        score = Math.min(score, 1);

        let label: 'BAJO' | 'MEDIO' | 'ALTO' = 'BAJO';
        if (score > 0.66) {
            label = 'ALTO';
        } else if (score > 0.33) {
            label = 'MEDIO';
        }

        return {
            score,
            label,
            reasons,
        };
    }
}
