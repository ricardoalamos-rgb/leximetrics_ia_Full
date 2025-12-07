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

    async createMany(data: any[], tenantId: string) {
        // Map DTO to DB schema, ensuring tenantId
        const records = data.map(item => ({
            ...item,
            tenantId,
            fechaIngreso: item.fechaIngreso ? new Date(item.fechaIngreso) : undefined,
            updatedAt: new Date(), // Explicitly set if needed, though default handles creation
        }));

        // Using createMany for bulk insertion efficiency
        // skipDuplicates is true to avoid errors on potential re-runs if unique constraints existed (Rol isn't unique yet, but safe practice)
        const result = await this.prisma.causa.createMany({
            data: records,
            skipDuplicates: true,
        });

        return {
            count: result.count,
            message: `Successfully created ${result.count} causes.`
        };
    }
}
