import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ScraperService } from './scraper.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class SyncCausaDto {
    rut: string;
    password: string; // In production this should be handled more securely or stored encrypted
    rit: string;
    tribunal: string;
}

@ApiTags('Scraper')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scraper')
export class ScraperController {
    constructor(private readonly scraperService: ScraperService) { }

    @Post('pjud/sync-causa')
    @ApiOperation({ summary: 'Trigger PJUD scraping for a Causa' })
    @ApiBody({ type: SyncCausaDto })
    async syncCausa(
        @Body() dto: SyncCausaDto,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        if (!dto.rut || !dto.password || !dto.rit || !dto.tribunal) {
            throw new BadRequestException('Missing required fields');
        }

        return this.scraperService.syncCausa(
            dto.rut,
            dto.password,
            dto.rit,
            dto.tribunal,
            tenantId,
        );
    }
}
