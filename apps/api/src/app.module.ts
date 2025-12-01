import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CausasModule } from './causas/causas.module';
import { GestionesModule } from './gestiones/gestiones.module';
import { RematesModule } from './remates/remates.module';
import { DocumentosModule } from './documentos/documentos.module';
import { StorageModule } from './storage/storage.module';
import { DocWorksModule } from './docworks/docworks.module';
import { ScraperModule } from './scraper/scraper.module';
import { CaseContextModule } from './case-context/case-context.module';
import { RiskModule } from './risk/risk.module';
import { HomeModule } from './home/home.module';
import { AiInteractionModule } from './ai-interaction/ai-interaction.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TemplatesModule } from './templates/templates.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { TenantConfigModule } from './tenant-config/tenant-config.module';
import { JarvisModule } from './jarvis/jarvis.module';

import { AiTelemetryModule } from './ai-telemetry/ai-telemetry.module';
import { HealthModule } from './health/health.module';
import { RolesGuard } from './auth/roles.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuthModule } from './auth/auth.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '../../../.env',
        }),
        PrismaModule,
        CausasModule,
        GestionesModule,
        RematesModule,
        DocumentosModule,
        StorageModule,
        DocWorksModule,
        ScraperModule,
        CaseContextModule,
        RiskModule,
        HomeModule,
        AiInteractionModule,
        AnalyticsModule,
        TemplatesModule,
        TelemetryModule,
        TenantConfigModule,
        TenantConfigModule,
        JarvisModule,
        // AiTelemetryModule, // Deprecated, merged into TelemetryModule
        HealthModule,
        AuthModule,
    ],
    controllers: [],
    providers: [
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
    ],
})
export class AppModule { }
