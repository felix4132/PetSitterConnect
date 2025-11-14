import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import 'reflect-metadata';
import { AppModule } from './app/app.module.js';
import { validateConfig } from './config/app.config.js';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // Validate configuration after ConfigModule loaded environment variables
    validateConfig();
    const configService = app.get(ConfigService);
    const logger = new Logger('Bootstrap');

    // Environment variables
    const port = parseInt(configService.get<string>('PORT') ?? '3000', 10);
    const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
    const apiPrefix = configService.get<string>('API_PREFIX') ?? 'api/v1';
    const allowedOriginsRaw =
        configService.get<string>('ALLOWED_ORIGINS') ?? '';
    const allowedOrigins: string[] = allowedOriginsRaw
        .split(',')
        .map((o) => o.trim())
        .filter((o) => o.length > 0);

    // Set log level based on environment
    const logLevel = configService.get<string>('LOG_LEVEL');
    if (logLevel) {
        Logger.overrideLogger(
            logLevel === 'debug'
                ? ['log', 'debug', 'error', 'verbose', 'warn']
                : ['log', 'error', 'warn'],
        );
    }

    // ValidationPipe is configured globally via APP_PIPE in AppModule

    // Security headers
    app.use(helmet());

    // API prefix from environment
    app.setGlobalPrefix(apiPrefix);

    // CORS configuration based on environment
    app.enableCors({
        origin:
            nodeEnv === 'production'
                ? allowedOrigins.length > 0
                    ? allowedOrigins
                    : false
                : true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    await app.listen(port);

    logger.log(
        `Application is running on: http://localhost:${port.toString()}/${apiPrefix}`,
    );
    logger.log(`Environment: ${nodeEnv}`);
    const apiVersion = configService.get<string>('API_VERSION') ?? 'not set';
    logger.log(`API Version: ${apiVersion}`);
    const rateLimitLimit =
        configService.get<string>('RATE_LIMIT_LIMIT') ?? '100';
    const rateLimitTtlMs = parseInt(
        configService.get<string>('RATE_LIMIT_TTL') ?? '60000',
        10,
    );
    const rateLimitTtlSeconds =
        (isNaN(rateLimitTtlMs) ? 60000 : rateLimitTtlMs) / 1000;
    const secondsDisplay = Number.isInteger(rateLimitTtlSeconds)
        ? rateLimitTtlSeconds.toString()
        : rateLimitTtlSeconds.toFixed(3);
    logger.log(
        `Rate Limiting: ${rateLimitLimit} requests per ${rateLimitTtlMs.toString()} ms (${secondsDisplay} s)`,
    );
    if (nodeEnv === 'production') {
        logger.log(
            `Allowed Origins: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : '(none - CORS disabled)'}`,
        );
    } else {
        logger.log('CORS: All origins allowed (development mode)');
    }
}

void bootstrap();
