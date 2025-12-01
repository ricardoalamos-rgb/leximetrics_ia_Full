import { Module } from '@nestjs/common';
import { GestionesService } from './gestiones.service';
import { GestionesController } from './gestiones.controller';

@Module({
    controllers: [GestionesController],
    providers: [GestionesService],
    exports: [GestionesService],
})
export class GestionesModule { }
