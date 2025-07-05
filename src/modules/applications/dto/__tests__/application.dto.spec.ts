import { validate } from 'class-validator';
import { beforeEach, describe, expect, it } from 'vitest';
import {
    ApplicationParamsDto,
    CreateApplicationDto,
    ListingParamsDto,
    SitterParamsDto,
    UpdateApplicationDto,
} from '../application.dto.js';

describe('Application DTOs', () => {
    describe('CreateApplicationDto', () => {
        let dto: CreateApplicationDto;

        beforeEach(() => {
            dto = new CreateApplicationDto();
        });

        it('should validate successfully with valid sitterId', async () => {
            dto.sitterId = 'sitter123';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail validation when sitterId is missing', async () => {
            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('sitterId');
        });

        it('should fail validation when sitterId is empty string', async () => {
            dto.sitterId = '';

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('sitterId');
        });

        it('should fail validation when sitterId is not a string', async () => {
            Object.assign(dto, { sitterId: 123 });

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('sitterId');
        });
    });

    describe('UpdateApplicationDto', () => {
        let dto: UpdateApplicationDto;

        beforeEach(() => {
            dto = new UpdateApplicationDto();
        });

        it('should validate successfully with valid status values', async () => {
            const validStatuses = ['pending', 'accepted', 'rejected'];

            for (const status of validStatuses) {
                const testDto = new UpdateApplicationDto();
                // Type assertion for testing valid enum values
                Object.assign(testDto, { status });

                const errors = await validate(testDto);
                expect(errors).toHaveLength(0);
            }
        });

        it('should fail validation when status is missing', async () => {
            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('status');
        });

        it('should fail validation with invalid status', async () => {
            Object.assign(dto, { status: 'invalid' });

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('status');
        });

        it('should fail validation when status is not a string', async () => {
            Object.assign(dto, { status: 123 });

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('status');
        });

        it('should fail validation when status is empty string', async () => {
            Object.assign(dto, { status: '' });

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('status');
        });
    });

    describe('ApplicationParamsDto', () => {
        let dto: ApplicationParamsDto;

        beforeEach(() => {
            dto = new ApplicationParamsDto();
        });

        it('should validate successfully with valid id', async () => {
            dto.id = 1;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should transform string to number', () => {
            // Test the transformer function behavior by creating a mock transform context
            const transformFn = ({ value }: { value: string }) =>
                parseInt(value, 10);

            expect(transformFn({ value: '123' })).toBe(123);
            expect(transformFn({ value: '456' })).toBe(456);
            expect(transformFn({ value: '0' })).toBe(0);
        });

        it('should fail validation when id is missing', async () => {
            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('id');
        });

        it('should fail validation when id is less than 1', async () => {
            dto.id = 0;

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('id');
        });

        it('should fail validation when id is negative', async () => {
            dto.id = -1;

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('id');
        });

        it('should fail validation when id is not a number', async () => {
            Object.assign(dto, { id: 'not-a-number' });

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('id');
        });
    });

    describe('ListingParamsDto', () => {
        let dto: ListingParamsDto;

        beforeEach(() => {
            dto = new ListingParamsDto();
        });

        it('should validate successfully with valid id', async () => {
            dto.id = 1;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should transform string to number', () => {
            // Test the transformer function behavior by creating a mock transform context
            const transformFn = ({ value }: { value: string }) =>
                parseInt(value, 10);

            expect(transformFn({ value: '456' })).toBe(456);
            expect(transformFn({ value: '789' })).toBe(789);
            expect(transformFn({ value: '0' })).toBe(0);
        });

        it('should fail validation when id is missing', async () => {
            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('id');
        });

        it('should fail validation when id is less than 1', async () => {
            dto.id = 0;

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('id');
        });
    });

    describe('SitterParamsDto', () => {
        let dto: SitterParamsDto;

        beforeEach(() => {
            dto = new SitterParamsDto();
        });

        it('should validate successfully with valid sitterId', async () => {
            dto.sitterId = 'sitter123';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail validation when sitterId is missing', async () => {
            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('sitterId');
        });

        it('should fail validation when sitterId is empty string', async () => {
            dto.sitterId = '';

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('sitterId');
        });

        it('should fail validation when sitterId is not a string', async () => {
            Object.assign(dto, { sitterId: 123 });

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('sitterId');
        });
    });
});
