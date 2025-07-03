import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter.js';
import { DatabaseModule } from '../infrastructure/database/database.module.js';
import { ApplicationsModule } from '../modules/applications/applications.module.js';
import { ListingsModule } from '../modules/listings/listings.module.js';
import { SeederModule } from '../seeder/seeder.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
        }),
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                throttlers: [
                    {
                        ttl: parseInt(
                            configService.get('RATE_LIMIT_TTL') ?? '60',
                            10,
                        ),
                        limit: parseInt(
                            configService.get('RATE_LIMIT_LIMIT') ?? '100',
                            10,
                        ),
                    },
                ],
            }),
        }),
        DatabaseModule,
        SeederModule,
        ListingsModule,
        ApplicationsModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: APP_FILTER,
            useClass: GlobalExceptionFilter,
        },
    ],
})
export class AppModule {}
