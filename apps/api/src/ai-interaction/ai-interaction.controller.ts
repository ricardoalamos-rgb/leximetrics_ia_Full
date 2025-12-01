import { Controller, Post, Body, UseGuards, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiInteractionService } from './ai-interaction.service';
import { LogInteractionDto } from './dto/log-interaction.dto';
import { ConfigService } from '@nestjs/config';
import { AiInteraction } from '@leximetrics/db';

@ApiTags('AI Interaction')
@Controller('ai/log-interaction')
export class AiInteractionController {
    constructor(
        private readonly aiInteractionService: AiInteractionService,
        private readonly configService: ConfigService,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Registrar interacción con IA (Internal Service)' })
    async logInteraction(
        @Body() dto: LogInteractionDto,
        @Headers('x-tenant-id') tenantId: string,
        @Headers('x-user-id') userId: string,
        // In a real scenario, validate a service token here
    ): Promise<AiInteraction> {
        if (!tenantId || !userId) {
            // For internal service calls, we expect these headers to be propagated
            // If called from frontend directly, authentication would be via Bearer token and CurrentUser decorator
            // This endpoint is designed for the AI Service to call back
            throw new UnauthorizedException('Missing context headers');
        }
        return this.aiInteractionService.logInteraction(tenantId, userId, dto);
    }
}
