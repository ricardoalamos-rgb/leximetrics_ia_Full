import { Module } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { DocWorksModule } from '../docworks/docworks.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
    imports: [DocWorksModule, PrismaModule, StorageModule],
    controllers: [TemplatesController],
    providers: [TemplatesService],
    exports: [TemplatesService],
})
export class TemplatesModule { }
