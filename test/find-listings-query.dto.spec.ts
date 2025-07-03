import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { FindListingsQueryDto } from '../src/modules/listings/dto/find-listings-query.dto.js';

describe('FindListingsQueryDto', () => {
    describe('validation', () => {
        it('should pass validation with valid parameters', async () => {
            const dto = plainToInstance(FindListingsQueryDto, {
                id: '1',
                ownerId: 'owner1',
                title: 'Test Listing',
                description: 'Test Description',
                species: 'dog',
                listingType: 'house-sitting',
                startDate: '2025-07-01',
                endDate: '2025-07-02',
                sitterVerified: 'true',
                price: '25.50',
                breed: 'Golden Retriever',
                age: '3',
                size: 'large',
                feeding: 'twice a day',
                medication: 'none',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with empty object', async () => {
            const dto = plainToInstance(FindListingsQueryDto, {});

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with partial parameters', async () => {
            const dto = plainToInstance(FindListingsQueryDto, {
                species: 'cat',
                price: '15.00',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail validation with invalid species', async () => {
            const dto = plainToInstance(FindListingsQueryDto, {
                species: 'invalid-species',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('species');
        });

        it('should fail validation with invalid listingType', async () => {
            const dto = plainToInstance(FindListingsQueryDto, {
                listingType: 'invalid-type',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('listingType');
        });

        it('should fail validation with invalid ISO8601 date', async () => {
            const dto = plainToInstance(FindListingsQueryDto, {
                startDate: 'invalid-date',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('startDate');
        });

        it('should fail validation with negative price', async () => {
            const dto = plainToInstance(FindListingsQueryDto, {
                price: '-10',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('price');
        });

        it('should fail validation with negative age', async () => {
            const dto = plainToInstance(FindListingsQueryDto, {
                age: '-5',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('age');
        });

        it('should fail validation with id less than 1', async () => {
            const dto = plainToInstance(FindListingsQueryDto, {
                id: '0',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('id');
        });
    });

    describe('transformation', () => {
        it('should transform string numbers to numbers', () => {
            const dto = plainToInstance(FindListingsQueryDto, {
                id: '123',
                price: '25.50',
                age: '3',
            });

            expect(dto.id).toBe(123);
            expect(dto.price).toBe(25.5);
            expect(dto.age).toBe(3);
        });

        it('should transform string booleans to booleans', () => {
            const trueDto = plainToInstance(FindListingsQueryDto, {
                sitterVerified: 'true',
            });
            const falseDto = plainToInstance(FindListingsQueryDto, {
                sitterVerified: 'false',
            });

            expect(trueDto.sitterVerified).toBe(true);
            expect(falseDto.sitterVerified).toBe(false);
        });

        it('should keep string fields as strings', () => {
            const dto = plainToInstance(FindListingsQueryDto, {
                ownerId: 'owner123',
                title: 'Test Title',
                description: 'Test Description',
                breed: 'Golden Retriever',
                size: 'large',
                feeding: 'twice a day',
                medication: 'none',
                startDate: '2025-07-01',
                endDate: '2025-07-02',
            });

            expect(typeof dto.ownerId).toBe('string');
            expect(typeof dto.title).toBe('string');
            expect(typeof dto.description).toBe('string');
            expect(typeof dto.breed).toBe('string');
            expect(typeof dto.size).toBe('string');
            expect(typeof dto.feeding).toBe('string');
            expect(typeof dto.medication).toBe('string');
            expect(typeof dto.startDate).toBe('string');
            expect(typeof dto.endDate).toBe('string');
        });

        it('should preserve enum values as strings', () => {
            const dto = plainToInstance(FindListingsQueryDto, {
                species: 'dog',
                listingType: 'house-sitting',
            });

            expect(dto.species).toBe('dog');
            expect(dto.listingType).toBe('house-sitting');
        });
    });

    describe('transformer error cases', () => {
        it('should fail validation for invalid id after transformation', async () => {
            const dto = plainToInstance(FindListingsQueryDto, {
                id: 'not-a-number',
            });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0]?.property).toBe('id');
        });
        it('should fail validation for invalid price after transformation', async () => {
            const dto = plainToInstance(FindListingsQueryDto, {
                price: 'not-a-number',
            });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0]?.property).toBe('price');
        });
        it('should fail validation for invalid age after transformation', async () => {
            const dto = plainToInstance(FindListingsQueryDto, {
                age: 'not-a-number',
            });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0]?.property).toBe('age');
        });
        it('should not throw for invalid sitterVerified, but set to false', () => {
            // Der aktuelle Transformer gibt nur true/false zurück, kein throw. Optional: Transformer anpassen, damit er bei ungültigen Werten wirft.
            const dto = plainToInstance(FindListingsQueryDto, {
                sitterVerified: 'not-a-bool',
            });
            // Der Wert ist dann false, weil 'not-a-bool' !== 'true'.
            expect(dto.sitterVerified).toBe(false);
        });
    });

    describe('edge cases for transform functions', () => {
        it('should handle non-string values in id transformer', async () => {
            const dto = plainToInstance(FindListingsQueryDto, {
                id: 123, // number, not string
            });
            expect(dto.id).toBe(123); // should pass through unchanged

            const errors = await validate(dto);
            expect(errors).toHaveLength(0); // should be valid since it's a valid number
        });

        it('should handle non-string values in price transformer', async () => {
            const dto = plainToInstance(FindListingsQueryDto, {
                price: 25.5, // number, not string
            });
            expect(dto.price).toBe(25.5); // should pass through unchanged

            const errors = await validate(dto);
            expect(errors).toHaveLength(0); // should be valid since it's a valid number
        });

        it('should handle non-string values in age transformer', async () => {
            const dto = plainToInstance(FindListingsQueryDto, {
                age: 5, // number, not string
            });
            expect(dto.age).toBe(5); // should pass through unchanged

            const errors = await validate(dto);
            expect(errors).toHaveLength(0); // should be valid since it's a valid number
        });

        it('should handle null/undefined values in transformers', () => {
            const dto = plainToInstance(FindListingsQueryDto, {
                id: null,
                price: undefined,
                age: null,
            });

            // Values should be passed through unchanged
            expect(dto.id).toBe(null);
            expect(dto.price).toBe(undefined);
            expect(dto.age).toBe(null);
        });
    });
});
