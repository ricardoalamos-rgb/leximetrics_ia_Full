import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CausasService } from './causas.service';
import { CausaRiskService } from './causa-risk.service';
import { Causa } from '@leximetrics/db';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@leximetrics/db';

@ApiTags('Causas')
@UseGuards(JwtAuthGuard)
@Controller('causas')
export class CausasController {
    constructor(
        private readonly causasService: CausasService,
        private readonly riskService: CausaRiskService,
    ) { }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.LAWYER, UserRole.PROCURATOR)
    @ApiOperation({ summary: 'List all causes for the current tenant' })
    findAll(@CurrentUser('tenantId') tenantId: string): Promise<Causa[]> {
        return this.causasService.findAllByTenant(tenantId);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.LAWYER, UserRole.PROCURATOR)
    @ApiOperation({ summary: 'Get a specific cause with relations' })
    findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string): Promise<Causa> {
        return this.causasService.findOneWithRelations(id, tenantId);
    }

    @Get(':id/riesgo')
    @Roles(UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'Get heuristic risk evaluation for a cause' })
    getRisk(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
        return this.riskService.evaluateRisk(id, tenantId);
    }
}
