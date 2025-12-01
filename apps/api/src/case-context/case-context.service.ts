import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CaseContextResponseDto, TimelineEventoDto } from './dto/case-context-response.dto';
import { EstadoCausa } from '@leximetrics/db';

@Injectable()
export class CaseContextService {
    private readonly logger = new Logger(CaseContextService.name);

    constructor(private readonly prisma: PrismaService) { }

    async buildContext(causaId: string, tenantId: string): Promise<CaseContextResponseDto> {
        // 1. Load Causa with relations
        const causa = await this.prisma.causa.findFirst({
            where: { id: causaId, tenantId },
            include: {
                gestiones: {
                    orderBy: { fecha: 'desc' },
                    take: 50,
                },
                remates: {
                    orderBy: { fechaRemate: 'desc' },
                },
                documentos: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
                tenant: {
                    include: {
                        tenantConfig: true,
                    },
                },
            },
        });

        if (!causa) {
            throw new NotFoundException(`Causa ${causaId} not found`);
        }

        // 2. Calculate Indicators
        const ultimaGestion = causa.gestiones[0];
        const fechaUltimaGestion = ultimaGestion ? new Date(ultimaGestion.fecha) : new Date(causa.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - fechaUltimaGestion.getTime());
        const diasSinGestion = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Risk logic based on TenantConfig or defaults
        const config = causa.tenant.tenantConfig || {} as any;
        const inactividadAmarillo = config.inactividadAmarilloDias || 15;
        const inactividadRojo = config.inactividadRojoDias || 30;

        let riesgoInactividad = 'VERDE';
        if (diasSinGestion >= inactividadRojo) {
            riesgoInactividad = 'ROJO';
        } else if (diasSinGestion >= inactividadAmarillo) {
            riesgoInactividad = 'AMARILLO';
        }

        // Simple heuristic for procedural stage
        let etapaProcesal = 'Inicial';
        if (causa.estado === EstadoCausa.SENTENCIA) {
            etapaProcesal = 'Sentencia';
        } else if (causa.remates.length > 0) {
            etapaProcesal = 'Ejecución / Remate';
        } else if (causa.gestiones.length > 5) {
            etapaProcesal = 'Discusión / Prueba';
        }

        // 3. Build Timeline
        const timelineEventos: TimelineEventoDto[] = [];

        // Add Gestiones
        causa.gestiones.forEach(g => {
            timelineEventos.push({
                tipo: 'GESTION',
                fecha: g.fecha,
                resumen: g.descripcion,
                meta: { id: g.id },
            });
        });

        // Add Remates
        causa.remates.forEach(r => {
            timelineEventos.push({
                tipo: 'REMATE',
                fecha: r.fechaRemate,
                resumen: `Remate programado (Min: ${r.minimo || 'N/A'})`,
                meta: { id: r.id },
            });
        });

        // Add Documentos
        causa.documentos.forEach(d => {
            timelineEventos.push({
                tipo: 'DOCUMENTO',
                fecha: d.createdAt,
                resumen: `Documento: ${d.nombre} (${d.tipo})`,
                meta: { id: d.id, url: d.url },
            });
        });

        // Sort timeline desc
        timelineEventos.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

        return {
            causa: {
                id: causa.id,
                rol: causa.rol,
                caratula: causa.caratula,
                tribunal: causa.tribunal,
                estado: causa.estado,
                createdAt: causa.createdAt,
            },
            gestiones: causa.gestiones.map(g => ({
                fecha: g.fecha,
                descripcion: g.descripcion,
                tipo: 'TRAMITE', // Default, could be refined if Gestion had type
            })),
            remates: causa.remates.map(r => ({
                fechaRemate: r.fechaRemate,
                minimo: r.minimo || undefined,
                garantia: r.garantia || undefined,
            })),
            documentosClave: causa.documentos.map(d => ({
                id: d.id,
                nombre: d.nombre,
                tipo: d.tipo,
                url: d.url,
                createdAt: d.createdAt,
            })),
            indicadoresRiesgo: {
                diasSinGestion,
                riesgoInactividad,
                etapaProcesal,
            },
            timelineEventos,
        };
    }
}
