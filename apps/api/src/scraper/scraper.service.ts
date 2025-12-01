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
            throw new InternalServerErrorException('Error synchronizing with PJUD scraper');
        }
    }
}
