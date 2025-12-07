import { Controller, Post, Get, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { JarvisService } from './jarvis.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

import { AskJarvisDto } from './dto/ask-jarvis.dto';

@ApiTags('JARVIS')
@Controller('jarvis')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JarvisController {
    constructor(private readonly jarvisService: JarvisService) { }

    @Post('ask-causa')
    @ApiOperation({ summary: 'Preguntar a JARVIS con contexto de causa' })
    async askCausa(
        @Body() body: AskJarvisDto,
        @CurrentUser('tenantId') tenantId: string,
        @CurrentUser('id') userId: string,
    ) {
        const { question, messages, causaId } = body;

        // Extract question from messages if not provided directly
        let finalQuestion = question;
        if (!finalQuestion && messages && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === 'user') {
                finalQuestion = lastMessage.content;
            }
        }

        if (!finalQuestion) {
            throw new BadRequestException('No question provided in body or messages');
        }

        return this.jarvisService.askForCausa({
            question: finalQuestion,
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
