import { Module } from '@nestjs/common';
import { CaseContextService } from './case-context.service';
import { CaseContextController } from './case-context.controller';

@Module({
    controllers: [CaseContextController],
    providers: [CaseContextService],
    exports: [CaseContextService],
})
export class CaseContextModule { }
