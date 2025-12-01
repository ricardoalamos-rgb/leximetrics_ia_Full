import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGestionDto } from './dto/create-gestion.dto';
import { UpdateGestionDto } from './dto/update-gestion.dto';

@Injectable()
export class GestionesService {
    constructor(private prisma: PrismaService) { }

    async create(createGestionDto: CreateGestionDto, tenantId: string, userId: string) {
        // Verify causa belongs to tenant
        const causa = await this.prisma.causa.findUnique({
            where: { id: createGestionDto.causaId },
        });

        if (!causa) {
            throw new NotFoundException('Causa not found');
        }

        if (causa.tenantId !== tenantId) {
            throw new ForbiddenException('Access to this causa is forbidden');
        }

        // Create gestion
        return this.prisma.gestion.create({
            data: {
                ...createGestionDto,
                tenantId,
            },
        });
    }

    async update(id: string, updateGestionDto: UpdateGestionDto, tenantId: string) {
        const gestion = await this.prisma.gestion.findUnique({
            where: { id },
            include: { causa: true },
        });

        if (!gestion) {
            throw new NotFoundException(`Gestion with ID ${id} not found`);
        }

        if (gestion.tenantId !== tenantId) {
            throw new ForbiddenException('Access to this resource is forbidden');
        }

        // If causaId is being updated, verify new causa belongs to tenant
        if (updateGestionDto.causaId && updateGestionDto.causaId !== gestion.causaId) {
            const newCausa = await this.prisma.causa.findUnique({
                where: { id: updateGestionDto.causaId },
            });
            if (!newCausa || newCausa.tenantId !== tenantId) {
                throw new ForbiddenException('New causa does not belong to tenant');
            }
        }

        return this.prisma.gestion.update({
            where: { id },
            data: updateGestionDto,
        });
    }

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

        return this.prisma.gestion.findMany({
            where: {
                causaId,
                tenantId,
            },
            orderBy: { fecha: 'desc' },
        });
    }
}
