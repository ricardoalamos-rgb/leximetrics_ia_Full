import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EstadoCausa, EstadoRemate } from '@leximetrics/db';

@Injectable()
export class KanbanService {
    constructor(private prisma: PrismaService) { }

    async getCausasBoard(tenantId: string) {
        const causas = await this.prisma.causa.findMany({
            where: { tenantId },
            select: {
                id: true,
                rol: true,
                caratula: true,
                tribunal: true,
                estado: true,
                ultimaGestion: true,
                probabilidadExito: true,
            },
        });

        // Agrupar por estado
        const board = {};
        Object.values(EstadoCausa).forEach(estado => {
            board[estado] = causas.filter(c => c.estado === estado);
        });

        return board;
    }

    async getRematesBoard(tenantId: string) {
        const remates = await this.prisma.remate.findMany({
            where: { tenantId },
            include: {
                causa: {
                    select: {
                        rol: true,
                        caratula: true,
                    }
                }
            }
        });

        // Agrupar por estado
        const board = {};
        Object.values(EstadoRemate).forEach(estado => {
            board[estado] = remates.filter(r => r.estado === estado);
        });

        return board;
    }

    async moveCard(tenantId: string, type: 'causa' | 'remate', id: string, newState: string): Promise<any> {
        if (type === 'causa') {
            return this.prisma.causa.update({
                where: { id, tenantId },
                data: { estado: newState as EstadoCausa },
            });
        } else {
            return this.prisma.remate.update({
                where: { id, tenantId },
                data: { estado: newState as EstadoRemate },
            });
        }
    }
}
