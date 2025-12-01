import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import 'multer';

@Injectable()
export class DocumentosService {
    constructor(
        private prisma: PrismaService,
        private storageService: StorageService,
    ) { }

    async upload(file: Express.Multer.File, createDocumentoDto: CreateDocumentoDto, tenantId: string) {

        // If causaId is provided, verify it belongs to tenant
        if (createDocumentoDto.causaId) {
            const causa = await this.prisma.causa.findUnique({
                where: { id: createDocumentoDto.causaId },
            });

            if (!causa) {
                throw new NotFoundException('Causa not found');
            }

            if (causa.tenantId !== tenantId) {
                throw new ForbiddenException('Access to this causa is forbidden');
            }
        }

        // Upload file
        const storagePath = await this.storageService.upload(file, tenantId);

        // Create record
        return this.prisma.documento.create({
            data: {
                nombre: file.originalname,
                url: storagePath, // In a real scenario, this might be a signed URL or public URL
                tipo: createDocumentoDto.type,
                tenantId,
                causaId: createDocumentoDto.causaId,
            },
        });
    }

    async findAllByCausa(causaId: string, tenantId: string) {
        const causa = await this.prisma.causa.findUnique({
            where: { id: causaId },
        });

        if (!causa) {
            throw new NotFoundException('Causa not found');
        }

        if (causa.tenantId !== tenantId) {
            throw new ForbiddenException('Access to this causa is forbidden');
        }

        return this.prisma.documento.findMany({
            where: {
                causaId,
                tenantId,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findAllKnowledgeBase(tenantId: string) {
        return this.prisma.documento.findMany({
            where: {
                tenantId,
                causaId: null, // General documents not linked to a specific causa
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, tenantId: string) {
        const documento = await this.prisma.documento.findUnique({
            where: { id },
        });

        if (!documento) {
            throw new NotFoundException(`Documento with ID ${id} not found`);
        }

        if (documento.tenantId !== tenantId) {
            throw new ForbiddenException('Access to this resource is forbidden');
        }

        return documento;
    }
}
