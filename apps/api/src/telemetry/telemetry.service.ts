import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAiUsageEventDto, UsageSummaryResponseDto } from './telemetry.dto';
import { AiUsageEvent, TelemetryFeature, AiProvider } from '@leximetrics/db';

@Injectable()
export class TelemetryService {
    constructor(private readonly prisma: PrismaService) { }

    async createFromInternal(dto: CreateAiUsageEventDto) {
        if (!dto.tenantId) {
            throw new BadRequestException('tenantId es obligatorio para registrar telemetría interna');
        }

        const event = await this.prisma.aiUsageEvent.create({
            data: {
                tenantId: dto.tenantId,
                userId: dto.userId || null,
                feature: dto.feature,
                provider: dto.provider,
                model: dto.model,
                tokensPrompt: dto.tokensPrompt,
                tokensCompletion: dto.tokensCompletion,
                tokensTotal: dto.tokensTotal,
                costUsd: dto.costUsd,
                latencyMs: dto.latencyMs ?? null,
                correlationId: dto.correlationId ?? null,
                source: dto.source ?? null,
                metadata: dto.metadata ?? {},
            },
        });

        return event;
    }

    async getUsageSummary(
        tenantId: string,
        from?: string,
        to?: string,
        userId?: string,
    ): Promise<UsageSummaryResponseDto> {
        const now = new Date();
        const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // últimos 30 días

        const fromDate = from ? new Date(from) : defaultFrom;
        const toDate = to ? new Date(to) : now;

        if (fromDate > toDate) {
            throw new BadRequestException('from no puede ser mayor que to');
        }

        const events = await this.prisma.aiUsageEvent.findMany({
            where: {
                tenantId,
                createdAt: {
                    gte: fromDate,
                    lte: toDate,
                },
                ...(userId ? { userId } : {}),
            },
        });

        let totalTokens = 0;
        let totalCostUsd = 0;

        const byUserMap = new Map<string, { userId: string | null; totalTokens: number; totalCostUsd: number }>();
        const byFeatureMap = new Map<
            TelemetryFeature,
            { feature: TelemetryFeature; totalTokens: number; totalCostUsd: number }
        >();
        const dailyMap = new Map<string, { date: string; totalTokens: number; totalCostUsd: number }>();

        for (const ev of events) {
            totalTokens += ev.tokensTotal;
            totalCostUsd += ev.costUsd;

            const userKey = ev.userId || 'SIN_USUARIO';
            const userEntry =
                byUserMap.get(userKey) ??
                { userId: ev.userId ?? null, totalTokens: 0, totalCostUsd: 0 };
            userEntry.totalTokens += ev.tokensTotal;
            userEntry.totalCostUsd += ev.costUsd;
            byUserMap.set(userKey, userEntry);

            const featureEntry =
                byFeatureMap.get(ev.feature) ??
                { feature: ev.feature, totalTokens: 0, totalCostUsd: 0 };
            featureEntry.totalTokens += ev.tokensTotal;
            featureEntry.totalCostUsd += ev.costUsd;
            byFeatureMap.set(ev.feature, featureEntry);

            const dayKey = ev.createdAt.toISOString().slice(0, 10);
            const dayEntry =
                dailyMap.get(dayKey) ??
                { date: dayKey, totalTokens: 0, totalCostUsd: 0 };
            dayEntry.totalTokens += ev.tokensTotal;
            dayEntry.totalCostUsd += ev.costUsd;
            dailyMap.set(dayKey, dayEntry);
        }

        return {
            from: fromDate.toISOString(),
            to: toDate.toISOString(),
            totalTokens,
            totalCostUsd,
            byUser: Array.from(byUserMap.values()),
            byFeature: Array.from(byFeatureMap.values()),
            daily: Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
        };
    }
}
