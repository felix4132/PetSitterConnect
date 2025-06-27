import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

describe('CORS Configuration (e2e)', () => {
    let app: INestApplication;

    describe('Development Mode (NODE_ENV !== production)', () => {
        beforeEach(async () => {
            // Sicherstellen, dass wir nicht in production sind
            process.env.NODE_ENV = 'development';

            const moduleFixture: TestingModule = await Test.createTestingModule(
                {
                    imports: [AppModule],
                },
            ).compile();

            app = moduleFixture.createNestApplication();

            // CORS wie in main.ts konfigurieren
            app.enableCors({
                origin:
                    process.env.NODE_ENV === 'production'
                        ? process.env.ALLOWED_ORIGINS?.split(',')
                        : true,
                credentials: true,
            });

            await app.init();
        });

        afterEach(async () => {
            await app.close();
        });

        it('should handle CORS preflight request', async () => {
            const response = await request(app.getHttpServer())
                .options('/')
                .set('Origin', 'http://localhost:3001')
                .set('Access-Control-Request-Method', 'GET')
                .set('Access-Control-Request-Headers', 'Content-Type')
                .expect(204);

            expect(response.headers['access-control-allow-origin']).toBe(
                'http://localhost:3001',
            );
            expect(response.headers['access-control-allow-credentials']).toBe(
                'true',
            );
            expect(
                response.headers['access-control-allow-methods'],
            ).toBeDefined();
        });

        it('should include CORS headers in GET requests', async () => {
            const response = await request(app.getHttpServer())
                .get('/')
                .set('Origin', 'http://localhost:3001')
                .expect(200);

            expect(response.headers['access-control-allow-origin']).toBe(
                'http://localhost:3001',
            );
            expect(response.headers['access-control-allow-credentials']).toBe(
                'true',
            );
        });

        it('should allow any origin in development', async () => {
            const response = await request(app.getHttpServer())
                .get('/')
                .set('Origin', 'http://random-domain.com')
                .expect(200);

            expect(response.headers['access-control-allow-origin']).toBe(
                'http://random-domain.com',
            );
        });
    });

    describe('Production Mode', () => {
        beforeEach(async () => {
            // Production-Umgebung simulieren
            process.env.NODE_ENV = 'production';
            process.env.ALLOWED_ORIGINS =
                'https://myapp.com,https://api.myapp.com';

            const moduleFixture: TestingModule = await Test.createTestingModule(
                {
                    imports: [AppModule],
                },
            ).compile();

            app = moduleFixture.createNestApplication();

            app.enableCors({
                origin:
                    process.env.NODE_ENV === 'production'
                        ? process.env.ALLOWED_ORIGINS
                            ? process.env.ALLOWED_ORIGINS.split(',')
                            : []
                        : true,
                credentials: true,
            });

            await app.init();
        });

        afterEach(async () => {
            await app.close();
            // Umgebungsvariablen zurücksetzen
            process.env.NODE_ENV = 'test';
            delete process.env.ALLOWED_ORIGINS;
        });

        it('should allow requests from allowed origins', async () => {
            const response = await request(app.getHttpServer())
                .get('/')
                .set('Origin', 'https://myapp.com')
                .expect(200);

            expect(response.headers['access-control-allow-origin']).toBe(
                'https://myapp.com',
            );
        });

        it('should allow requests from second allowed origin', async () => {
            const response = await request(app.getHttpServer())
                .get('/')
                .set('Origin', 'https://api.myapp.com')
                .expect(200);

            expect(response.headers['access-control-allow-origin']).toBe(
                'https://api.myapp.com',
            );
        });

        it('should reject requests from non-allowed origins', async () => {
            const response = await request(app.getHttpServer())
                .get('/')
                .set('Origin', 'https://malicious-site.com')
                .expect(200);

            // In production sollte die Origin nicht in den Headers stehen
            expect(response.headers['access-control-allow-origin']).not.toBe(
                'https://malicious-site.com',
            );
        });
    });
});
