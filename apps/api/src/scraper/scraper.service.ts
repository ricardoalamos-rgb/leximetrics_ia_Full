import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ScraperService {
    private readonly logger = new Logger(ScraperService.name);
    private readonly scraperServiceUrl: string;
    private readonly scraperServiceToken: string;

    constructor(private readonly configService: ConfigService) {
        this.scraperServiceUrl = this.configService.get<string>('SCRAPER_SERVICE_URL') || 'http://localhost:8001'; // Default to local port 8001 if not set, assuming docker-compose maps it there or we run it there
        this.scraperServiceToken = this.configService.get<string>('SCRAPER_SERVICE_TOKEN');
    }

    async syncCausa(rut: string, password: string, rit: string, tribunal: string, tenantId: string) {
        try {
            this.logger.log(`Syncing causa ${rit} in ${tribunal} for tenant ${tenantId}`);

            const response = await axios.post(
                `${this.scraperServiceUrl}/pjud/scrape`,
                {
                    rut,
                    password,
                    rit,
                    tribunal,
                    tenant_id: tenantId,
                },
                {
                    headers: {
                        'X-Service-Token': this.scraperServiceToken,
                    },
                },
            );

            this.logger.log(`Scraper response: ${JSON.stringify(response.data)}`);

            // Here we would update the database with the result
            // For now, we just return the result
            return response.data;

        } catch (error) {
            this.logger.error(`Error syncing causa: ${error.message}`, error.stack);
            // Non-blocking error for batch operations (we want detailed logs but not crash)
            if (error.response) {
                this.logger.error(`Scraper remote error: ${JSON.stringify(error.response.data)}`);
            }
            throw new InternalServerErrorException('Error synchronizing with PJUD scraper');
        }
    }

    async batchSync(rut: string, password: string, tasks: { rit: string; tribunal: string }[], tenantId: string) {
        this.logger.log(`Starting batch sync for ${tasks.length} tasks`);
        // Iterate and call syncCausa sequentially or parallel with limit
        // Simple loop for now
        for (const task of tasks) {
            try {
                // Fire and forget individual tasks or await them?
                // Await to ensure we don't overwhelm external service (or user's PJUD session)
                await this.syncCausa(rut, password, task.rit, task.tribunal, tenantId);
            } catch (err) {
                this.logger.warn(`Failed to sync task ${task.rit}: ${err.message}`);
                // Continue with next
            }
            // Small delay to be nice to PJUD?
            await new Promise(r => setTimeout(r, 2000));
        }
        this.logger.log('Batch sync completed');
    }
}
