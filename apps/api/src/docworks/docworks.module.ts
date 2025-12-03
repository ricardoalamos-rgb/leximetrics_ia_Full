import { Module, forwardRef } from '@nestjs/common';
import { DocWorksService } from './docworks.service';
import { TemplatesController } from './templates.controller';
import { StorageService } from '../storage/storage.service';
import { TemplatesModule } from '../templates/templates.module';

@Module({
    imports: [forwardRef(() => TemplatesModule)],
    controllers: [TemplatesController],
    providers: [DocWorksService, StorageService],
    exports: [DocWorksService],
})
export class DocWorksModule { }
