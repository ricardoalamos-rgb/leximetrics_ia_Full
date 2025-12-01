import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CaseContextService } from './case-context.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CaseContextResponseDto } from './dto/case-context-response.dto';

@ApiTags('CaseContext')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('case-context')
export class CaseContextController {
    constructor(private readonly caseContextService: CaseContextService) { }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener contexto 360° de una causa (para J.A.R.V.I.S.)' })
    getContext(
        @Param('id') id: string,
        @CurrentUser('tenantId') tenantId: string,
    ): Promise<CaseContextResponseDto> {
        return this.caseContextService.buildContext(id, tenantId);
    }
}
