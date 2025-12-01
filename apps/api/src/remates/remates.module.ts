import { Module } from '@nestjs/common';
import { RematesService } from './remates.service';
import { RematesController } from './remates.controller';

@Module({
    controllers: [RematesController],
    providers: [RematesService],
    exports: [RematesService],
})
export class RematesModule { }
