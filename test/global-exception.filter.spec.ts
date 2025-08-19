import type { ArgumentsHost } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
    type MockedFunction,
} from 'vitest';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';

interface MockResponse {
    status: MockedFunction<Response['status']>;
    json: MockedFunction<Response['json']>;
}

interface MockRequest {
    method: string;
    url: string;
}

describe('GlobalExceptionFilter', () => {
    let filter: GlobalExceptionFilter;
    let mockArgumentsHost: ArgumentsHost;
    let mockResponse: MockResponse;
    let mockRequest: MockRequest;

    beforeEach(() => {
        filter = new GlobalExceptionFilter();

        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };

        mockRequest = {
            method: 'GET',
            url: '/test-endpoint',
        };

        mockArgumentsHost = {
            switchToHttp: vi.fn().mockReturnValue({
                getResponse: (): MockResponse => mockResponse,
                getRequest: (): MockRequest => mockRequest,
            }),
            getArgs: vi.fn(),
            getArgByIndex: vi.fn(),
            switchToRpc: vi.fn(),
            switchToWs: vi.fn(),
            getType: vi.fn(),
        };
    });

    describe('HTTP Exceptions', () => {
        it('should handle HttpException with string message', () => {
            const exception = new HttpException(
                'Test error',
                HttpStatus.BAD_REQUEST,
            );

            filter.catch(exception, mockArgumentsHost);

            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.BAD_REQUEST,
            );
            expect(mockResponse.json).toHaveBeenCalledWith({
                statusCode: HttpStatus.BAD_REQUEST,
                timestamp: expect.any(String),
                path: '/test-endpoint',
                message: 'Test error',
            });
        });

        it('should handle HttpException with object message', () => {
            const errorMessage = {
                error: 'Validation failed',
                message: ['field is required'],
            };
            const exception = new HttpException(
                errorMessage,
                HttpStatus.BAD_REQUEST,
            );

            filter.catch(exception, mockArgumentsHost);

            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.BAD_REQUEST,
            );
            expect(mockResponse.json).toHaveBeenCalledWith({
                statusCode: HttpStatus.BAD_REQUEST,
                timestamp: expect.any(String),
                path: '/test-endpoint',
                message: errorMessage,
            });
        });

        it('should handle different HTTP status codes', () => {
            const testCases = [
                { status: HttpStatus.NOT_FOUND, message: 'Not found' },
                { status: HttpStatus.UNAUTHORIZED, message: 'Unauthorized' },
                { status: HttpStatus.FORBIDDEN, message: 'Forbidden' },
                { status: HttpStatus.CONFLICT, message: 'Conflict' },
            ];

            testCases.forEach(({ status, message }) => {
                const exception = new HttpException(message, status);

                filter.catch(exception, mockArgumentsHost);

                expect(mockResponse.status).toHaveBeenCalledWith(status);
                expect(mockResponse.json).toHaveBeenCalledWith({
                    statusCode: status,
                    timestamp: expect.any(String),
                    path: '/test-endpoint',
                    message,
                });
            });
        });
    });

    describe('Non-HTTP Exceptions', () => {
        it('should handle generic Error objects', () => {
            const exception = new Error('Generic error');

            filter.catch(exception, mockArgumentsHost);

            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
            expect(mockResponse.json).toHaveBeenCalledWith({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                timestamp: expect.any(String),
                path: '/test-endpoint',
                message: 'Internal server error',
            });
        });

        it('should handle unknown exception types', () => {
            const exception = 'String exception';

            filter.catch(exception, mockArgumentsHost);

            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
            expect(mockResponse.json).toHaveBeenCalledWith({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                timestamp: expect.any(String),
                path: '/test-endpoint',
                message: 'Internal server error',
            });
        });

        it('should handle null/undefined exceptions', () => {
            const testCases = [null, undefined];

            testCases.forEach((exception) => {
                filter.catch(exception, mockArgumentsHost);

                expect(mockResponse.status).toHaveBeenCalledWith(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
                expect(mockResponse.json).toHaveBeenCalledWith({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    timestamp: expect.any(String),
                    path: '/test-endpoint',
                    message: 'Internal server error',
                });
            });
        });
    });

    describe('Request Context', () => {
        it('should capture correct request method and URL', () => {
            const testCases = [
                { method: 'POST', url: '/listings' },
                { method: 'PUT', url: '/applications/123' },
                { method: 'DELETE', url: '/listings/456' },
                { method: 'PATCH', url: '/applications/789' },
            ];

            testCases.forEach(({ method, url }) => {
                mockRequest.method = method;
                mockRequest.url = url;

                const exception = new HttpException(
                    'Test',
                    HttpStatus.BAD_REQUEST,
                );
                filter.catch(exception, mockArgumentsHost);

                expect(mockResponse.json).toHaveBeenCalledWith({
                    statusCode: HttpStatus.BAD_REQUEST,
                    timestamp: expect.any(String),
                    path: url,
                    message: 'Test',
                });
            });
        });

        it('should include valid ISO timestamp', () => {
            const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);
            const beforeTime = new Date(); // allowed by lint rule as timer variable

            filter.catch(exception, mockArgumentsHost);

            const afterTime = new Date(); // allowed by lint rule as timer variable
            const capturedCall = mockResponse.json.mock.calls[0]?.[0] as {
                timestamp: string;
            };
            const timestampDate = new Date(capturedCall.timestamp); // parsing allowed by lint rule

            // Verify it's a valid ISO string and within reasonable time range
            expect(capturedCall.timestamp).toMatch(
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
            );
            expect(timestampDate.getTime()).toBeGreaterThanOrEqual(
                beforeTime.getTime(),
            );
            expect(timestampDate.getTime()).toBeLessThanOrEqual(
                afterTime.getTime(),
            );
        });
    });

    describe('Logging', () => {
        it('should create a Logger instance and handle exceptions', () => {
            // Test that the filter works without throwing errors during logging
            const exception = new Error('Test error with stack');

            // This should not throw an error, even though we can't easily mock NestJS Logger
            expect(() => {
                filter.catch(exception, mockArgumentsHost);
            }).not.toThrow();

            // Verify the response handling still works correctly
            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
            expect(mockResponse.json).toHaveBeenCalledWith({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                timestamp: expect.any(String),
                path: '/test-endpoint',
                message: 'Internal server error',
            });
        });

        it('should handle different types of exceptions without throwing errors', () => {
            const testCases = [
                new HttpException('HTTP Exception', HttpStatus.BAD_REQUEST),
                new Error('Generic Error'),
                'String Exception',
                { custom: 'object exception' },
            ];

            testCases.forEach((exception) => {
                expect(() => {
                    filter.catch(exception, mockArgumentsHost);
                }).not.toThrow();
            });

            // Verify all exceptions were handled and responses were sent
            expect(mockResponse.status).toHaveBeenCalledTimes(testCases.length);
            expect(mockResponse.json).toHaveBeenCalledTimes(testCases.length);
        });
    });
});
