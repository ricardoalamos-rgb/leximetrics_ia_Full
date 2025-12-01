import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantConfigService } from './tenant-config.service';

@ApiTags('TenantConfig')
@ApiBearerAuth()
@Controller('tenant-config')
@UseGuards(JwtAuthGuard)
export class TenantConfigController {
    constructor(private readonly tenantConfigService: TenantConfigService) { }

    @Get('docworks-style')
    @ApiOperation({ summary: 'Obtener estilo DocWorks del estudio' })
    async getDocWorksStyle(@CurrentUser('tenantId') tenantId: string) {
        const config = await this.tenantConfigService.getConfig(tenantId);
        return config.docWorksStyle || {};
    }

    @Patch('docworks-style')
    @ApiOperation({ summary: 'Actualizar estilo DocWorks del estudio' })
    async updateDocWorksStyle(
        @CurrentUser('tenantId') tenantId: string,
        @Body() style: any,
    ) {
        const config = await this.tenantConfigService.updateDocWorksStyle(tenantId, style);
        return config.docWorksStyle || {};
    }
}
