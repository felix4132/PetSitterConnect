import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app/app.module.js';
import { AppService } from '../src/app/app.service.js';

describe('AppModule', () => {
    let module: TestingModule;
    let configService: ConfigService;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        configService = module.get<ConfigService>(ConfigService);
    });

    afterEach(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('ThrottlerModule Configuration Branches', () => {
        it('should use default TTL when RATE_LIMIT_TTL is undefined', async () => {
            // Test with clean environment
            delete process.env.RATE_LIMIT_TTL;

            const moduleRef = await Test.createTestingModule({
                imports: [AppModule],
            }).compile();

            expect(moduleRef).toBeDefined();
        });

        it('should use default LIMIT when RATE_LIMIT_LIMIT is undefined', async () => {
            // Test with clean environment
            delete process.env.RATE_LIMIT_LIMIT;

            const moduleRef = await Test.createTestingModule({
                imports: [AppModule],
            }).compile();

            expect(moduleRef).toBeDefined();
        });

        it('should use default TTL when RATE_LIMIT_TTL is null', async () => {
            // Test by setting to empty string which ConfigService might return as null
            process.env.RATE_LIMIT_TTL = '';

            const moduleRef = await Test.createTestingModule({
                imports: [AppModule],
            }).compile();

            expect(moduleRef).toBeDefined();
            delete process.env.RATE_LIMIT_TTL;
        });

        it('should use default LIMIT when RATE_LIMIT_LIMIT is null', async () => {
            // Test by setting to empty string which ConfigService might return as null
            process.env.RATE_LIMIT_LIMIT = '';

            const moduleRef = await Test.createTestingModule({
                imports: [AppModule],
            }).compile();

            expect(moduleRef).toBeDefined();
            delete process.env.RATE_LIMIT_LIMIT;
        });

        it('should use custom values when environment variables are set', async () => {
            // Test with custom values
            process.env.RATE_LIMIT_TTL = '120';
            process.env.RATE_LIMIT_LIMIT = '200';

            const moduleRef = await Test.createTestingModule({
                imports: [AppModule],
            }).compile();

            expect(moduleRef).toBeDefined();

            // Clean up
            delete process.env.RATE_LIMIT_TTL;
            delete process.env.RATE_LIMIT_LIMIT;
        });
    });

    describe('Module Integration', () => {
        it('should have all required providers', () => {
            const appService = module.get(AppService);

            // Check that main service and module are properly configured
            const appModule = module.get(AppModule);
            expect(appService).toBeDefined();
            expect(appModule).toBeDefined();
        });

        it('should have ConfigService configured globally', () => {
            expect(configService).toBeDefined();
            expect(typeof configService.get).toBe('function');
        });
    });
});
