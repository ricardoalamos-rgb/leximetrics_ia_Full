import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecordUsageDto } from './dto/record-usage.dto';

@Injectable()
export class AiTelemetryService {
    constructor(private readonly prisma: PrismaService) { }

    async recordUsage(
        tenantId: string,
        userId: string | null,
        dto: RecordUsageDto,
    ): Promise<any> {
        return this.prisma.aiUsage.create({
            data: {
                tenantId,
                userId: userId || undefined,
                feature: dto.feature,
                provider: dto.provider,
                model: dto.model,
                tokensInput: dto.tokensInput ?? null,
                tokensOutput: dto.tokensOutput ?? null,
                costUsd: dto.costUsd ?? null,
                latencyMs: dto.latencyMs ?? null,
                success: dto.success ?? true,
                errorCode: dto.errorCode ?? null,
                meta: dto.meta ?? {},
            },
        });
    }

    async getTenantSummary(tenantId: string, days: number = 7) {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const raw = await this.prisma.aiUsage.groupBy({
            by: ['feature'],
            where: {
                tenantId,
                createdAt: { gte: since },
            },
            _count: { _all: true },
            _sum: { tokensInput: true, tokensOutput: true, costUsd: true },
        });

        return raw.map((r) => ({
            feature: r.feature,
            calls: r._count._all,
            tokensInput: r._sum.tokensInput ?? 0,
            tokensOutput: r._sum.tokensOutput ?? 0,
            costUsd: r._sum.costUsd ?? 0,
        }));
    }

    async getUserSummary(tenantId: string, userId: string, days: number = 7) {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const raw = await this.prisma.aiUsage.groupBy({
            by: ['feature'],
            where: {
                tenantId,
                userId,
                createdAt: { gte: since },
            },
            _count: { _all: true },
            _sum: { tokensInput: true, tokensOutput: true, costUsd: true },
        });

        return raw.map((r) => ({
            feature: r.feature,
            calls: r._count._all,
            tokensInput: r._sum.tokensInput ?? 0,
            tokensOutput: r._sum.tokensOutput ?? 0,
            costUsd: r._sum.costUsd ?? 0,
        }));
    }
}
