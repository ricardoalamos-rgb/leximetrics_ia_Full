import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AiTelemetryService } from './ai-telemetry.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('ai-telemetry')
@Controller('ai-telemetry')
@UseGuards(JwtAuthGuard)
export class AiTelemetryController {
    constructor(private readonly telemetryService: AiTelemetryService) { }

    @Get('tenant-summary')
    @ApiOperation({ summary: 'Obtener resumen de uso de IA del tenant' })
    @ApiQuery({ name: 'days', required: false, type: Number, description: 'Días hacia atrás (default 7)' })
    async getTenantSummary(@Request() req, @Query('days') days?: string) {
        const tenantId = req.user.tenantId;
        const daysNum = days ? parseInt(days, 10) : 7;
        return this.telemetryService.getTenantSummary(tenantId, daysNum);
    }

    @Get('user-summary')
    @ApiOperation({ summary: 'Obtener resumen de uso de IA del usuario actual' })
    @ApiQuery({ name: 'days', required: false, type: Number, description: 'Días hacia atrás (default 7)' })
    async getUserSummary(@Request() req, @Query('days') days?: string) {
        const tenantId = req.user.tenantId;
        const userId = req.user.id;
        const daysNum = days ? parseInt(days, 10) : 7;
        return this.telemetryService.getUserSummary(tenantId, userId, daysNum);
    }
}
