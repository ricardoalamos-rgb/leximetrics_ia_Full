import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Causa } from '@leximetrics/db';

@Injectable()
export class CausasService {
    constructor(private prisma: PrismaService) { }

    async findAllByTenant(tenantId: string): Promise<Causa[]> {
        return this.prisma.causa.findMany({
            where: { tenantId },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async findOneWithRelations(id: string, tenantId: string): Promise<Causa> {
        const causa = await this.prisma.causa.findUnique({
            where: { id },
            include: {
                gestiones: {
                    orderBy: { fecha: 'desc' },
                },
                remates: true,
            },
        });

        if (!causa) {
            throw new NotFoundException(`Causa with ID ${id} not found`);
        }

        if (causa.tenantId !== tenantId) {
            throw new ForbiddenException('Access to this resource is forbidden');
        }

        return causa;
    }
}
