import { Module } from '@nestjs/common';
import { AiInteractionService } from './ai-interaction.service';
import { AiInteractionController } from './ai-interaction.controller';

@Module({
    controllers: [AiInteractionController],
    providers: [AiInteractionService],
    exports: [AiInteractionService],
})
export class AiInteractionModule { }
