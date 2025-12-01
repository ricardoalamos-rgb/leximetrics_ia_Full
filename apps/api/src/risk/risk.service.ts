import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CausaRiskSummaryDto } from './dto/causa-risk-summary.dto';
import { EstadoCausa } from '@leximetrics/db';

@Injectable()
export class RiskService {
    constructor(private readonly prisma: PrismaService) { }

    async getCausasConRiesgo(tenantId: string): Promise<CausaRiskSummaryDto[]> {
        const [causas, tenantConfig] = await Promise.all([
            this.prisma.causa.findMany({
                where: { tenantId },
                include: {
                    remates: {
                        orderBy: { fechaRemate: 'asc' },
                    },
                },
            }),
            this.prisma.tenantConfig.findUnique({ where: { tenantId } }),
        ]);

        const amarillo = tenantConfig?.inactividadAmarilloDias ?? 7;
        const rojo = tenantConfig?.inactividadRojoDias ?? 15;

        const now = new Date();

        return causas.map((c) => {
            let diasSinGestion = 0;
            if (c.ultimaGestion) {
                const diffMs = now.getTime() - c.ultimaGestion.getTime();
                diasSinGestion = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            }

            let riesgoInactividad = 'VERDE';
            if (diasSinGestion >= rojo) riesgoInactividad = 'ROJO';
            else if (diasSinGestion >= amarillo) riesgoInactividad = 'AMARILLO';

            let riesgoProcesal = 'BAJO';
            if (c.estado === EstadoCausa.ETAPA_REMATE || c.estado === EstadoCausa.EMBARGADO) {
                riesgoProcesal = 'ALTO';
            } else if (c.estado === EstadoCausa.NOTIFICADO || c.estado === EstadoCausa.SIN_NOTIFICAR) {
                riesgoProcesal = 'MEDIO';
            }

            const proximoRemate = c.remates.find((r) => r.fechaRemate && r.fechaRemate > now);

            return {
                causaId: c.id,
                snumcaso: c.snumcaso,
                rol: c.rol ?? null,
                tribunal: c.tribunal ?? null,
                nombreDeudor: c.nombreDeudor ?? null,
                diasSinGestion,
                riesgoInactividad,
                riesgoProcesal,
                fechaProximoRemate: proximoRemate?.fechaRemate ?? null,
                estado: c.estado,
            };
        });
    }

    async getCausasRojas(tenantId: string): Promise<CausaRiskSummaryDto[]> {
        const all = await this.getCausasConRiesgo(tenantId);
        return all.filter(
            (c) => c.riesgoInactividad === 'ROJO' || c.riesgoProcesal === 'ALTO',
        );
    }
}
