import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GestionesService } from './gestiones.service';
import { CreateGestionDto } from './dto/create-gestion.dto';
import { UpdateGestionDto } from './dto/update-gestion.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@leximetrics/db';

@ApiTags('Gestiones')
@UseGuards(JwtAuthGuard)
@Controller('gestiones')
export class GestionesController {
    constructor(private readonly gestionesService: GestionesService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.LAWYER, UserRole.PROCURATOR)
    @ApiOperation({ summary: 'Create a new gestion' })
    create(
        @Body() createGestionDto: CreateGestionDto,
        @CurrentUser('tenantId') tenantId: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.gestionesService.create(createGestionDto, tenantId, userId);
    }

    @Get('by-causa/:causaId')
    @Roles(UserRole.ADMIN, UserRole.LAWYER, UserRole.PROCURATOR)
    @ApiOperation({ summary: 'List gestiones for a specific causa' })
    findByCausa(
        @Param('causaId') causaId: string,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        return this.gestionesService.findByCausa(causaId, tenantId);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'Update a gestion' })
    update(
        @Param('id') id: string,
        @Body() updateGestionDto: UpdateGestionDto,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        return this.gestionesService.update(id, updateGestionDto, tenantId);
    }
}
