import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: [
            'test/**/*.spec.ts',
            'test/**/*.test.ts',
            'test/**/*.e2e-spec.ts',
            'src/**/*.spec.ts',
            'src/**/*.test.ts',
        ],
        exclude: ['node_modules', 'dist'],
        setupFiles: ['reflect-metadata'],
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            reportsDirectory: './coverage',
            exclude: [
                'node_modules/',
                'dist/',
                'coverage/',
                'test/',
                '**/*.spec.ts',
                '**/*.test.ts',
                '**/*.e2e-spec.ts',
                'src/main.ts',
                '*.config.*',
                'vitest.config.ts',
                'eslint.config.mts',
                'nest-cli.json',
                'tsconfig*.json',
            ],
            thresholds: {
                global: {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80,
                },
            },
        },
        reporters: ['verbose'],
        testTimeout: 10000,
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
});
