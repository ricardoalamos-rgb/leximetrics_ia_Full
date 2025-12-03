import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JarvisService } from './jarvis.service';
import { JarvisController } from './jarvis.controller';

@Module({
    imports: [AuthModule],
    providers: [JarvisService],
    controllers: [JarvisController],
    exports: [JarvisService],
})
export class JarvisModule { }
