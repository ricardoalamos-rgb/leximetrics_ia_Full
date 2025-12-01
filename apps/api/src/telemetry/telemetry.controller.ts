import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { CreateAiUsageEventDto, UsageSummaryResponseDto } from './telemetry.dto';
import { InternalServiceGuard } from '../auth/internal-service.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@leximetrics/db';

@ApiTags('Telemetry')
@Controller('telemetry')
export class TelemetryController {
    constructor(private readonly telemetryService: TelemetryService) { }

    @Post('ai-usage')
    @UseGuards(InternalServiceGuard)
    @ApiOperation({ summary: 'Registrar un evento de uso de IA (servicio interno)' })
    async createInternal(@Body() dto: CreateAiUsageEventDto) {
        const event = await this.telemetryService.createFromInternal(dto);
        return { id: event.id, createdAt: event.createdAt };
    }

    @Get('usage-summary')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Obtener resumen de uso de IA por tenant/usuario/feature' })
    async getSummary(
        @CurrentUser('tenantId') tenantId: string,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('userId') userId?: string,
    ): Promise<UsageSummaryResponseDto> {
        return this.telemetryService.getUsageSummary(tenantId, from, to, userId);
    }
}
