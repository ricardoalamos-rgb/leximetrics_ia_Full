import { Module } from '@nestjs/common';
import { JarvisService } from './jarvis.service';
import { JarvisController } from './jarvis.controller';

@Module({
    providers: [JarvisService],
    controllers: [JarvisController],
    exports: [JarvisService],
})
export class JarvisModule { }
