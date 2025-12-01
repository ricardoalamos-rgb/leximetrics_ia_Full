import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RematesService {
    constructor(private prisma: PrismaService) { }

    async findByCausa(causaId: string, tenantId: string) {
        const causa = await this.prisma.causa.findUnique({
            where: { id: causaId },
        });

        if (!causa) {
            throw new NotFoundException('Causa not found');
        }

        if (causa.tenantId !== tenantId) {
            throw new ForbiddenException('Access to this causa is forbidden');
        }

        return this.prisma.remate.findMany({
            where: {
                causaId,
                tenantId,
            },
            orderBy: { fechaRemate: 'asc' },
        });
    }

    async findUpcoming(tenantId: string) {
        return this.prisma.remate.findMany({
            where: {
                tenantId,
                fechaRemate: {
                    gte: new Date(),
                },
            },
            include: {
                causa: {
                    select: {
                        rol: true,
                        caratula: true,
                        tribunal: true,
                    },
                },
            },
            orderBy: { fechaRemate: 'asc' },
        });
    }
}
