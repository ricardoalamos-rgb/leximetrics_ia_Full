import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { initSentry } from './sentry/sentry.config';
import { SentryInterceptor } from './sentry/sentry.interceptor';

async function bootstrap() {
    initSentry();
    const app = await NestFactory.create(AppModule);
    app.useGlobalInterceptors(new SentryInterceptor());

    app.setGlobalPrefix('api/v1');

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );

    const config = new DocumentBuilder()
        .setTitle('Leximetrics IA API')
        .setDescription('API for Leximetrics IA Legal Operating System')
        .setVersion('1.0')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.listen(process.env.PORT || 3001, '0.0.0.0');
}
bootstrap();
