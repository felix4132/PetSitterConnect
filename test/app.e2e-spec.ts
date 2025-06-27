import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

describe('AppController (e2e)', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    describe('GET /', () => {
        it('should return "Hello World!" with status 200', async () => {
            // Arrange & Act
            const response = await request(app.getHttpServer())
                .get('/')
                .expect(200);

            // Assert
            expect(response.text).toBe('Hello World!');
        });
    });
});
