import { type INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Rate Limiting (e2e)', () => {
    let app: INestApplication;

    beforeEach(async () => {
        // Set rate limiting environment variables for testing
        process.env.RATE_LIMIT_TTL = '1'; // 1 second for faster testing
        process.env.RATE_LIMIT_LIMIT = '3'; // 3 requests per second

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
    });

    afterEach(async () => {
        await app.close();
        // Reset environment variables
        delete process.env.RATE_LIMIT_TTL;
        delete process.env.RATE_LIMIT_LIMIT;
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
