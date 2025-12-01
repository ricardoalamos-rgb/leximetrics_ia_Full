import { Controller, Get, UseGuards } from '@nestjs/common';
import { RiskService } from './risk.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CausaRiskSummaryDto } from './dto/causa-risk-summary.dto';

@ApiTags('Risk')
@ApiBearerAuth()
@Controller('risk')
@UseGuards(JwtAuthGuard)
export class RiskController {
    constructor(private readonly riskService: RiskService) { }

    @Get('causas')
    @ApiOperation({ summary: 'Listado de riesgo por causa (Tenant Scoped)' })
    getCausas(@CurrentUser('tenantId') tenantId: string): Promise<CausaRiskSummaryDto[]> {
        return this.riskService.getCausasConRiesgo(tenantId);
    }

    @Get('causas-rojas')
    @ApiOperation({ summary: 'Listado de causas en ROJO / riesgo ALTO' })
    getCausasRojas(@CurrentUser('tenantId') tenantId: string): Promise<CausaRiskSummaryDto[]> {
        return this.riskService.getCausasRojas(tenantId);
    }
}
