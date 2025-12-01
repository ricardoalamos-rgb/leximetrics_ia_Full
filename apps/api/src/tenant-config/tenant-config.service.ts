import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantConfigService {
    constructor(private readonly prisma: PrismaService) { }

    async getConfig(tenantId: string): Promise<any> {
        let config = await this.prisma.tenantConfig.findUnique({ where: { tenantId } });
        if (!config) {
            config = await this.prisma.tenantConfig.create({
                data: {
                    tenantId,
                    alertEmails: [],
                    docWorksStyle: {},
                },
            });
        }
        return config;
    }

    async updateDocWorksStyle(tenantId: string, style: any): Promise<any> {
        await this.getConfig(tenantId);

        return this.prisma.tenantConfig.update({
            where: { tenantId },
            data: { docWorksStyle: style },
        });
    }
}
