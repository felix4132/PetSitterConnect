import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
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
