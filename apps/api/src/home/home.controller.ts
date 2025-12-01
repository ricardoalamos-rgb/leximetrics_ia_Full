import { Controller, Get, UseGuards } from '@nestjs/common';
import { HomeService } from './home.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HomeResponseDto } from './dto/home-response.dto';

@ApiTags('Home')
@ApiBearerAuth()
@Controller('home')
@UseGuards(JwtAuthGuard)
export class HomeController {
    constructor(private readonly homeService: HomeService) { }

    @Get()
    @ApiOperation({ summary: 'Home / Mi Día Legal para el usuario autenticado' })
    getHome(@CurrentUser() user: AuthenticatedUser): Promise<HomeResponseDto> {
        return this.homeService.getHome(user.tenantId, user.id, user.role);
    }
}
