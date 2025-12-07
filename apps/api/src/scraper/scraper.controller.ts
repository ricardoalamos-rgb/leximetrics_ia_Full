import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ScraperService } from './scraper.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class TaskDto {
    @IsString()
    rit: string;
    @IsString()
    tribunal: string;
}

class SyncCausaDto {
    @IsString()
    rut: string;
    @IsString()
    password: string;
    @IsString()
    rit: string;
    @IsString()
    tribunal: string;
}

class BatchSyncDto {
    @IsString()
    rut: string;
    @IsString()
    password: string;
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TaskDto)
    tasks: TaskDto[];
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

    @Post('batch-sync')
    @ApiOperation({ summary: 'Trigger batch PJUD scraping' })
    @ApiBody({ type: BatchSyncDto })
    async batchSync(
        @Body() dto: BatchSyncDto,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        if (!dto.rut || !dto.password || !dto.tasks || dto.tasks.length === 0) {
            throw new BadRequestException('Missing required fields or tasks');
        }

        // Processing asynchronously to avoid timeout
        // In a real scenario, push to queue. Here, we map promises but don't await all if we want fast response?
        // Actually, user expects "Scheduled".

        this.scraperService.batchSync(dto.rut, dto.password, dto.tasks, tenantId);

        return { message: `Scheduled ${dto.tasks.length} scraping tasks` };
    }
}
