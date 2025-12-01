import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RematesService } from './remates.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@leximetrics/db';

@ApiTags('Remates')
@UseGuards(JwtAuthGuard)
@Controller('remates')
export class RematesController {
    constructor(private readonly rematesService: RematesService) { }

    @Get('upcoming')
    @Roles(UserRole.ADMIN, UserRole.LAWYER, UserRole.PROCURATOR)
    @ApiOperation({ summary: 'List upcoming remates' })
    findUpcoming(@CurrentUser('tenantId') tenantId: string) {
        return this.rematesService.findUpcoming(tenantId);
    }

    @Get('by-causa/:causaId')
    @Roles(UserRole.ADMIN, UserRole.LAWYER, UserRole.PROCURATOR)
    @ApiOperation({ summary: 'List remates for a specific causa' })
    findByCausa(
        @Param('causaId') causaId: string,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        return this.rematesService.findByCausa(causaId, tenantId);
    }
}
