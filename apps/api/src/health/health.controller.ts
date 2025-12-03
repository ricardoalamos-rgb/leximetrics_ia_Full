import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Controller('health')
export class HealthController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    async basic() {
        await this.prisma.$queryRaw`SELECT 1`;
        return { status: 'ok', db: 'up' };
    }

    @Get('deep')
    async deep() {
        const result: any = {
            status: 'ok',
            services: {},
        };

        // DB
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            result.services.db = 'up';
        } catch {
            result.services.db = 'down';
            result.status = 'degraded';
        }

        const services = [
            {
                name: 'ai-service',
                url: `${process.env.AI_SERVICE_URL ?? 'http://localhost:8000'}/health`,
            },
            {
                name: 'scraper-service',
                url: `${process.env.SCRAPER_SERVICE_URL ?? 'http://localhost:8001'}/health`,
            },
            {
                name: 'jarvis-backend',
                url: `${process.env.JARVIS_BACKEND_URL ?? 'http://localhost:8004'}/health`,
            },
        ];

        for (const svc of services) {
            try {
                const resp = await axios.get(svc.url, { timeout: 2000 });
                result.services[svc.name] = resp.status === 200 ? 'up' : 'degraded';
            } catch {
                result.services[svc.name] = 'down';
                result.status = 'degraded';
            }
        }

        return result;
    }
}
