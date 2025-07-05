import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import 'reflect-metadata';
import { AppModule } from './app/app.module.js';
import { validateConfig } from './config/index.js';

async function bootstrap() {
    // Validate configuration before starting the application
    validateConfig();

    const app = await NestFactory.create(AppModule);
    const logger = new Logger('Bootstrap');

    // Environment variables
    const port = parseInt(process.env.PORT ?? '3000', 10);
    const nodeEnv = process.env.NODE_ENV ?? 'development';
    const apiPrefix = process.env.API_PREFIX ?? 'api/v1';
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') ?? [];

    // Set log level based on environment
    if (process.env.LOG_LEVEL) {
        Logger.overrideLogger(
            process.env.LOG_LEVEL === 'debug'
                ? ['log', 'debug', 'error', 'verbose', 'warn']
                : ['log', 'error', 'warn'],
        );
    }

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

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
    logger.log(`API Version: ${process.env.API_VERSION ?? 'not set'}`);
    logger.log(
        `Rate Limiting: ${process.env.RATE_LIMIT_LIMIT ?? '100'} requests per ${process.env.RATE_LIMIT_TTL ?? '60'} seconds`,
    );
    if (nodeEnv === 'production') {
        logger.log(`Allowed Origins: ${allowedOrigins.join(', ')}`);
    } else {
        logger.log('CORS: All origins allowed (development mode)');
    }
}

void bootstrap();
