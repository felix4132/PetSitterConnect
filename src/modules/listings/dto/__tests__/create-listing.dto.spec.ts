import { validate } from 'class-validator';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateListingDto } from '../create-listing.dto.js';

describe('CreateListingDto', () => {
    let dto: CreateListingDto;

    beforeEach(() => {
        dto = new CreateListingDto();
    });

    describe('Valid DTO', () => {
        it('should validate successfully with all required fields', async () => {
            dto.ownerId = 'owner123';
            dto.title = 'Pet Sitting Job';
            dto.description = 'Looking for a pet sitter';
            dto.species = 'dog';
            dto.listingType = ['house-sitting'];
            dto.startDate = '2025-08-01';
            dto.endDate = '2025-08-05';
            dto.sitterVerified = true;
            dto.price = 25.5;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate successfully with optional fields', async () => {
            dto.ownerId = 'owner123';
            dto.title = 'Pet Sitting Job';
            dto.description = 'Looking for a pet sitter';
            dto.species = 'cat';
            dto.listingType = ['day-care'];
            dto.startDate = '2025-08-01';
            dto.endDate = '2025-08-05';
            dto.sitterVerified = false;
            dto.price = 15;
            dto.breed = 'Persian';
            dto.age = 3;
            dto.size = 'medium';
            dto.feeding = 'twice daily';
            dto.medication = 'none';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('Required Field Validation', () => {
        it('should fail validation when ownerId is missing', async () => {
            dto.title = 'Pet Sitting Job';
            dto.description = 'Looking for a pet sitter';
            dto.species = 'dog';
            dto.listingType = ['house-sitting'];
            dto.startDate = '2025-08-01';
            dto.endDate = '2025-08-05';
            dto.sitterVerified = true;
            dto.price = 25;

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('ownerId');
        });

        it('should fail validation when title is empty', async () => {
            dto.ownerId = 'owner123';
            dto.title = '';
            dto.description = 'Looking for a pet sitter';
            dto.species = 'dog';
            dto.listingType = ['house-sitting'];
            dto.startDate = '2025-08-01';
            dto.endDate = '2025-08-05';
            dto.sitterVerified = true;
            dto.price = 25;

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('title');
        });

        it('should fail validation when price is negative', async () => {
            dto.ownerId = 'owner123';
            dto.title = 'Pet Sitting Job';
            dto.description = 'Looking for a pet sitter';
            dto.species = 'dog';
            dto.listingType = ['house-sitting'];
            dto.startDate = '2025-08-01';
            dto.endDate = '2025-08-05';
            dto.sitterVerified = true;
            dto.price = -5;

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('price');
        });
    });

    describe('Enum Validation', () => {
        it('should fail validation with invalid species', async () => {
            dto.ownerId = 'owner123';
            dto.title = 'Pet Sitting Job';
            dto.description = 'Looking for a pet sitter';
            dto.species = 'invalid' as any;
            dto.listingType = ['house-sitting'];
            dto.startDate = '2025-08-01';
            dto.endDate = '2025-08-05';
            dto.sitterVerified = true;
            dto.price = 25;

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('species');
        });

        it('should validate all valid species values', async () => {
            const validSpecies = ['dog', 'cat', 'bird', 'exotic', 'other'];

            for (const species of validSpecies) {
                const testDto = new CreateListingDto();
                testDto.ownerId = 'owner123';
                testDto.title = 'Pet Sitting Job';
                testDto.description = 'Looking for a pet sitter';
                testDto.species = species as any;
                testDto.listingType = ['house-sitting'];
                testDto.startDate = '2025-08-01';
                testDto.endDate = '2025-08-05';
                testDto.sitterVerified = true;
                testDto.price = 25;

                const errors = await validate(testDto);
                expect(errors).toHaveLength(0);
            }
        });

        it('should validate all valid listingType values', async () => {
            const validTypes = [
                'house-sitting',
                'drop-in-visit',
                'day-care',
                'walks',
                'feeding',
                'overnight',
            ];

            for (const listingType of validTypes) {
                const testDto = new CreateListingDto();
                testDto.ownerId = 'owner123';
                testDto.title = 'Pet Sitting Job';
                testDto.description = 'Looking for a pet sitter';
                testDto.species = 'dog';
                testDto.listingType = [listingType as any];
                testDto.startDate = '2025-08-01';
                testDto.endDate = '2025-08-05';
                testDto.sitterVerified = true;
                testDto.price = 25;

                const errors = await validate(testDto);
                expect(errors).toHaveLength(0);
            }
        });
    });

    describe('Date Validation', () => {
        it('should fail validation with invalid ISO date format', async () => {
            dto.ownerId = 'owner123';
            dto.title = 'Pet Sitting Job';
            dto.description = 'Looking for a pet sitter';
            dto.species = 'dog';
            dto.listingType = ['house-sitting'];
            dto.startDate = 'invalid-date';
            dto.endDate = '2025-08-05';
            dto.sitterVerified = true;
            dto.price = 25;

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('startDate');
        });

        it('should validate with proper ISO date format', async () => {
            dto.ownerId = 'owner123';
            dto.title = 'Pet Sitting Job';
            dto.description = 'Looking for a pet sitter';
            dto.species = 'dog';
            dto.listingType = ['house-sitting'];
            dto.startDate = '2025-08-01T10:00:00Z';
            dto.endDate = '2025-08-05T18:00:00Z';
            dto.sitterVerified = true;
            dto.price = 25;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('Optional Field Validation', () => {
        it('should fail validation when age is negative', async () => {
            dto.ownerId = 'owner123';
            dto.title = 'Pet Sitting Job';
            dto.description = 'Looking for a pet sitter';
            dto.species = 'dog';
            dto.listingType = ['house-sitting'];
            dto.startDate = '2025-08-01';
            dto.endDate = '2025-08-05';
            dto.sitterVerified = true;
            dto.price = 25;
            dto.age = -1;

            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
            expect(errors[0]?.property).toBe('age');
        });

        it('should validate successfully when optional fields are undefined', async () => {
            dto.ownerId = 'owner123';
            dto.title = 'Pet Sitting Job';
            dto.description = 'Looking for a pet sitter';
            dto.species = 'dog';
            dto.listingType = ['house-sitting'];
            dto.startDate = '2025-08-01';
            dto.endDate = '2025-08-05';
            dto.sitterVerified = true;
            dto.price = 25;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('Array Validation', () => {
        it('should validate with multiple listingType values', async () => {
            dto.ownerId = 'owner123';
            dto.title = 'Pet Sitting Job';
            dto.description = 'Looking for a pet sitter';
            dto.species = 'dog';
            dto.listingType = ['house-sitting', 'day-care', 'walks'];
            dto.startDate = '2025-08-01';
            dto.endDate = '2025-08-05';
            dto.sitterVerified = true;
            dto.price = 25;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail validation with empty listingType array', async () => {
            dto.ownerId = 'owner123';
            dto.title = 'Pet Sitting Job';
            dto.description = 'Looking for a pet sitter';
            dto.species = 'dog';
            dto.listingType = [];
            dto.startDate = '2025-08-01';
            dto.endDate = '2025-08-05';
            dto.sitterVerified = true;
            dto.price = 25;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0]?.property).toBe('listingType');
        });

        it('should fail validation with duplicate listingType values', async () => {
            dto.ownerId = 'owner123';
            dto.title = 'Pet Sitting Job';
            dto.description = 'Looking for a pet sitter';
            dto.species = 'dog';
            dto.listingType = ['house-sitting', 'house-sitting'];
            dto.startDate = '2025-08-01';
            dto.endDate = '2025-08-05';
            dto.sitterVerified = true;
            dto.price = 25;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0]?.property).toBe('listingType');
        });

        it('should fail validation with invalid listingType value in array', async () => {
            dto.ownerId = 'owner123';
            dto.title = 'Pet Sitting Job';
            dto.description = 'Looking for a pet sitter';
            dto.species = 'dog';
            dto.listingType = ['house-sitting', 'invalid-type'] as any;
            dto.startDate = '2025-08-01';
            dto.endDate = '2025-08-05';
            dto.sitterVerified = true;
            dto.price = 25;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0]?.property).toBe('listingType');
        });
    });
});
