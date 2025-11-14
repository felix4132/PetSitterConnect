// @ts-check
import eslint from '@eslint/js';
import type { Rule } from 'eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Inline plugin: no-direct-date-in-tests (ehemals in ./no-direct-date-in-tests.js)
const localTestsPlugin = {
    rules: {
        'no-direct-date-in-tests': {
            meta: {
                type: 'problem',
                docs: {
                    description:
                        'Disallow direct Date.now() and new Date() usages in tests; use test helpers like isoDatePlus/isoDate instead',
                    recommended: false,
                },
                schema: [],
                messages: {
                    avoidDateNow:
                        'Avoid Date.now() in tests. Use isoDatePlus()/isoDate from test-helpers instead, or rename to startTime/endTime for performance timing.',
                    avoidNewDate:
                        'Avoid new Date() in tests. Use isoDatePlus()/isoDate from test-helpers instead.',
                },
            },
            create(context: Rule.RuleContext) {
                function isPerfTimerDeclarator(node: any) {
                    // Allow: const startTime = Date.now(); const endTime = Date.now();
                    // Also allow: beforeTime/afterTime used to bound timestamps in tests
                    if (node && node.type === 'VariableDeclarator') {
                        const id = node.id;
                        if (id && id.type === 'Identifier') {
                            return /^(start|end|before|after)Time$/i.test(
                                id.name,
                            );
                        }
                    }
                    return false;
                }

                return {
                    CallExpression(node: any) {
                        // Match Date.now()
                        if (
                            node.callee &&
                            node.callee.type === 'MemberExpression' &&
                            !node.callee.computed &&
                            node.callee.object.type === 'Identifier' &&
                            node.callee.object.name === 'Date' &&
                            node.callee.property.type === 'Identifier' &&
                            node.callee.property.name === 'now'
                        ) {
                            // Exception for startTime/endTime timers
                            const parent = node.parent;
                            if (isPerfTimerDeclarator(parent)) return;
                            if (
                                parent &&
                                parent.type === 'VariableDeclarator' &&
                                isPerfTimerDeclarator(parent)
                            )
                                return;
                            context.report({ node, messageId: 'avoidDateNow' });
                        }
                    },
                    NewExpression(node: any) {
                        // Match new Date() with zero args; allow new Date(value) for parsing
                        if (
                            node.callee &&
                            node.callee.type === 'Identifier' &&
                            node.callee.name === 'Date' &&
                            (!node.arguments || node.arguments.length === 0)
                        ) {
                            const parent = node.parent;
                            if (isPerfTimerDeclarator(parent)) return;
                            // Allow parsing: new Date(<arg>)
                            if (node.arguments && node.arguments.length > 0)
                                return;
                            context.report({ node, messageId: 'avoidNewDate' });
                        }
                    },
                };
            },
        },
    },
} as const;

export default tseslint.config(
    {
        ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
    },
    {
        files: ['src/**/*.ts', 'test/**/*.ts', 'scripts/**/*.ts'],

        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.strictTypeChecked,
            eslintPluginPrettierRecommended,
        ],

        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.es2022,
            },
            sourceType: 'module',
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },

        rules: {
            // TypeScript specific rules
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-unsafe-argument': 'warn',
            '@typescript-eslint/no-unsafe-assignment': 'warn',
            '@typescript-eslint/no-unsafe-call': 'warn',
            '@typescript-eslint/no-unsafe-member-access': 'warn',
            '@typescript-eslint/no-unsafe-return': 'warn',

            // NestJS specific rules
            '@typescript-eslint/interface-name-prefix': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-extraneous-class': 'off',
            '@typescript-eslint/prefer-nullish-coalescing': 'error',
            '@typescript-eslint/prefer-optional-chain': 'error',

            // General rules
            'no-console': 'warn',
            'prefer-const': 'error',
            'no-var': 'error',
        },
    },
    {
        files: ['test/**/*.ts'],
        plugins: {
            'local-tests': localTestsPlugin,
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            'no-console': 'off',
            'local-tests/no-direct-date-in-tests': 'error',
        },
    },
    {
        files: ['test/test-helpers.ts'],
        rules: {
            'local-tests/no-direct-date-in-tests': 'off',
        },
    },
);
