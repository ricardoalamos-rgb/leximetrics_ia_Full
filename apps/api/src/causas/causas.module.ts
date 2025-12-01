import { Module } from '@nestjs/common';
import { CausasService } from './causas.service';
import { CausaRiskService } from './causa-risk.service';
import { CausasController } from './causas.controller';

@Module({
    controllers: [CausasController],
    providers: [CausasService, CausaRiskService],
    exports: [CausasService],
})
export class CausasModule { }
