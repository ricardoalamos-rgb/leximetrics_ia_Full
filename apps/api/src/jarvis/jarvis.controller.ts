import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JarvisService } from './jarvis.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

class AskCausaDto {
    question: string;
    causaId: string;
}

@ApiTags('JARVIS')
@Controller('jarvis')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JarvisController {
    constructor(private readonly jarvisService: JarvisService) { }

    @Post('ask-causa')
    @ApiOperation({ summary: 'Preguntar a JARVIS con contexto de causa' })
    async askCausa(
        @Body() body: AskCausaDto,
        @CurrentUser('tenantId') tenantId: string,
        @CurrentUser('id') userId: string,
    ) {
        const { question, causaId } = body;
        return this.jarvisService.askForCausa({
            question,
            causaId,
            tenantId,
            userId,
        });
    }
}
