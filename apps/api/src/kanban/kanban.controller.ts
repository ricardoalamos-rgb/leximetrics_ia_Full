import { Controller, Get, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { KanbanService } from './kanban.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Kanban')
@Controller('kanban')
@UseGuards(JwtAuthGuard)
export class KanbanController {
    constructor(private readonly kanbanService: KanbanService) { }

    @Get('causas')
    @ApiOperation({ summary: 'Obtener tablero Kanban de Causas' })
    async getCausasBoard(@CurrentUser('tenantId') tenantId: string) {
        return this.kanbanService.getCausasBoard(tenantId);
    }

    @Get('remates')
    @ApiOperation({ summary: 'Obtener tablero Kanban de Remates' })
    async getRematesBoard(@CurrentUser('tenantId') tenantId: string) {
        return this.kanbanService.getRematesBoard(tenantId);
    }

    @Patch('move')
    @ApiOperation({ summary: 'Mover tarjeta de estado' })
    async moveCard(
        @CurrentUser('tenantId') tenantId: string,
        @Body() body: { type: 'causa' | 'remate'; id: string; newState: string }
    ): Promise<any> {
        return this.kanbanService.moveCard(tenantId, body.type, body.id, body.newState);
    }
}
