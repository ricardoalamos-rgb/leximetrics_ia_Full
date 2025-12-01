import { Module } from '@nestjs/common';
import { DocumentosService } from './documentos.service';
import { DocumentosController } from './documentos.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
    imports: [StorageModule],
    controllers: [DocumentosController],
    providers: [DocumentosService],
    exports: [DocumentosService],
})
export class DocumentosModule { }
