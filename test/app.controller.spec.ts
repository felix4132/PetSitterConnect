import { describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../src/app/app.controller.ts';
import { AppService } from '../src/app/app.service.ts';

describe('AppController', () => {
    let appController: AppController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [AppController],
            providers: [AppService],
        }).compile();

        appController = app.get<AppController>(AppController);
    });

    describe('getHello', () => {
        it('should return "Hello World!"', () => {
            // Arrange & Act
            const result = appController.getHello();

            // Assert
            expect(result).toBe('Hello World!');
        });
    });
});
