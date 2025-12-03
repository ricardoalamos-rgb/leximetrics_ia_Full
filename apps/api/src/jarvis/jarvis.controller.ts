import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { JarvisService } from './jarvis.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

class AskCausaDto {
    question: string;
    causaId: string;
}

@ApiTags('JARVIS')
@Controller('jarvis')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JarvisController {
    constructor(private readonly jarvisService: JarvisService) { }

    @Post('ask-causa')
    @ApiOperation({ summary: 'Preguntar a JARVIS con contexto de causa' })
    async askCausa(
        @Body() body: AskCausaDto,
        @CurrentUser('tenantId') tenantId: string,
        @CurrentUser('id') userId: string,
    ) {
        const { question, causaId } = body;
        return this.jarvisService.askForCausa({
            question,
            causaId,
            tenantId,
            userId,
        });
    }

    @Public()
    @Get('debug-ping')
    async debugPing() {
        try {
            return await this.jarvisService.askForCausa({
                question: 'Ping de prueba',
                causaId: 'debug',
                tenantId: 'debug-tenant',
                userId: 'debug-user'
            });
        } catch (error) {
            return {
                status: 'error',
                message: error.message,
                stack: error.stack
            };
        }
    }

    @Get('telemetry/sources')
    @ApiOperation({ summary: 'Obtener telemetría de fuentes' })
    async getTelemetrySources() {
        return this.jarvisService.getTelemetrySources();
    }

    @Get('telemetry/indexing')
    @ApiOperation({ summary: 'Obtener estado de indexación' })
    async getIndexingStatus() {
        return this.jarvisService.getIndexingStatus();
    }

    @Get('telemetry/scrapers-health')
    @ApiOperation({ summary: 'Obtener salud de scrapers' })
    async getScrapersHealth() {
        return this.jarvisService.getScrapersHealth();
    }
}
