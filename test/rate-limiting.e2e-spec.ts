import { type INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppController } from '../src/app.controller.js';
import { AppService } from '../src/app.service.js';

describe('Rate Limiting (e2e)', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: ['.env.local', '.env'],
                }),
                ThrottlerModule.forRoot([
                    {
                        ttl: 1000, // 1 second for faster testing
                        limit: 3, // 3 requests per second
                    },
                ]),
            ],
            controllers: [AppController],
            providers: [
                AppService,
                {
                    provide: APP_GUARD,
                    useClass: ThrottlerGuard,
                },
            ],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('should allow requests within the rate limit', async () => {
        // Make 3 requests (within limit)
        for (let i = 0; i < 3; i++) {
            await request(app.getHttpServer()).get('/').expect(200);
        }
    });

    it('should block requests exceeding the rate limit', async () => {
        // Make 3 requests (within limit)
        for (let i = 0; i < 3; i++) {
            await request(app.getHttpServer()).get('/').expect(200);
        }

        // 4th request should be blocked with 429 Too Many Requests
        await request(app.getHttpServer()).get('/').expect(429);
    });

    it('should reset rate limit after TTL expires', async () => {
        // Make 3 requests (within limit)
        for (let i = 0; i < 3; i++) {
            await request(app.getHttpServer()).get('/').expect(200);
        }

        // 4th request should be blocked
        await request(app.getHttpServer()).get('/').expect(429);

        // Wait for TTL to expire (1 second + buffer)
        await new Promise((resolve) => setTimeout(resolve, 1100));

        // Should be able to make requests again
        await request(app.getHttpServer()).get('/').expect(200);
    });

    it('should include rate limit headers in response', async () => {
        const response = await request(app.getHttpServer())
            .get('/')
            .expect(200);

        // Check for rate limit headers
        expect(response.headers['x-ratelimit-limit']).toBeDefined();
        expect(response.headers['x-ratelimit-remaining']).toBeDefined();
        expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });
});
