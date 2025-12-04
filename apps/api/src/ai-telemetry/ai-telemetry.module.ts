import { Module } from '@nestjs/common';
import { AiTelemetryService } from './ai-telemetry.service';
import { AiTelemetryController } from './ai-telemetry.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AiTelemetryController],
    providers: [AiTelemetryService],
    exports: [AiTelemetryService],
})
export class AiTelemetryModule { }
