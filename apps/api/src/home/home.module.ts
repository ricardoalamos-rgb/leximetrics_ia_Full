import { Module } from '@nestjs/common';
import { HomeService } from './home.service';
import { HomeController } from './home.controller';
import { RiskModule } from '../risk/risk.module';

@Module({
    imports: [RiskModule],
    controllers: [HomeController],
    providers: [HomeService],
})
export class HomeModule { }
