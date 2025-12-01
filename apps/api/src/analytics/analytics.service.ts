import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private readonly prisma: PrismaService) { }

    async getAiUsage(tenantId: string, startDate?: Date, endDate?: Date) {
        const where: any = { tenantId };
        if (startDate && endDate) {
            where.timestamp = {
                gte: startDate,
                lte: endDate,
            };
        }

        const usage = await this.prisma.aiInteraction.groupBy({
            by: ['origen'],
            where,
            _count: {
                id: true,
            },
        });

        return usage.map((u) => ({
            origen: u.origen,
            count: u._count.id,
        }));
    }

    async getAiErrors(tenantId: string) {
        // Placeholder: In a real implementation, we would query logs or a specific error table
        // For now, returning 0 as we don't explicitly store failed interactions in AiInteraction yet
        return {
            count: 0,
            message: 'Error tracking not fully implemented yet',
        };
    }

    async getAiQuality(tenantId: string) {
        const accepted = await this.prisma.aiInteraction.count({
            where: {
                tenantId,
                aceptadaPorUsuario: true,
            },
        });

        const rejected = await this.prisma.aiInteraction.count({
            where: {
                tenantId,
                aceptadaPorUsuario: false,
            },
        });

        const total = await this.prisma.aiInteraction.count({
            where: { tenantId },
        });

        return {
            total,
            accepted,
            rejected,
            acceptanceRate: total > 0 ? accepted / total : 0,
        };
    }
}
