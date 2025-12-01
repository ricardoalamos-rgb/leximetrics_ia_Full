import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('ai/usage')
    @ApiOperation({ summary: 'Obtener estadísticas de uso de IA' })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    async getAiUsage(
        @CurrentUser('tenantId') tenantId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.analyticsService.getAiUsage(tenantId, start, end);
    }

    @Get('ai/errors')
    @ApiOperation({ summary: 'Obtener conteo de errores de IA' })
    async getAiErrors(@CurrentUser('tenantId') tenantId: string) {
        return this.analyticsService.getAiErrors(tenantId);
    }

    @Get('ai/quality')
    @ApiOperation({ summary: 'Obtener métricas de calidad de IA (aceptación)' })
    async getAiQuality(@CurrentUser('tenantId') tenantId: string) {
        return this.analyticsService.getAiQuality(tenantId);
    }
}
