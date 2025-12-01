import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RiskService } from '../risk/risk.service';
import { HomeResponseDto } from './dto/home-response.dto';
import { UserRole } from '@leximetrics/db';

@Injectable()
export class HomeService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly riskService: RiskService,
    ) { }

    async getHome(tenantId: string, userId: string, role: UserRole): Promise<HomeResponseDto> {
        const causasRiesgo = await this.riskService.getCausasConRiesgo(tenantId);
        const causasEnRojo = causasRiesgo
            .filter((c) => c.riesgoInactividad === 'ROJO' || c.riesgoProcesal === 'ALTO')
            .slice(0, 5);

        const now = new Date();
        const rematesProximosRaw = await this.prisma.remate.findMany({
            where: {
                tenantId,
                fechaRemate: { gte: now },
            },
            include: {
                causa: {
                    select: { id: true, rol: true, snumcaso: true, nombreDeudor: true },
                },
            },
            orderBy: { fechaRemate: 'asc' },
            take: 5,
        });

        const rematesProximos = rematesProximosRaw.map((r) => ({
            id: r.id,
            causaId: r.causa.id,
            fechaRemate: r.fechaRemate!,
            rol: r.causa.rol ?? null,
            snumcaso: r.causa.snumcaso ?? null,
            nombreDeudor: r.causa.nombreDeudor ?? null,
        }));

        return {
            causasEnRojo: causasEnRojo.map((c) => ({
                causaId: c.causaId,
                snumcaso: c.snumcaso,
                nombreDeudor: c.nombreDeudor ?? null,
                riesgoInactividad: c.riesgoInactividad,
                riesgoProcesal: c.riesgoProcesal,
            })),
            rematesProximos,
        };
    }
}
