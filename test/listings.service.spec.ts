import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Listing } from '../src/domain/listings/listing.entity.ts';
import { DatabaseService } from '../src/infrastructure/database/database.service.ts';
import { ListingsService } from '../src/modules/listings/listings.service.ts';

describe('ListingsService', () => {
    let service: ListingsService;
    let mockDatabaseService: {
        addListing: ReturnType<typeof vi.fn>;
        getListings: ReturnType<typeof vi.fn>;
        getListing: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
        // Mock des DatabaseService
        mockDatabaseService = {
            addListing: vi.fn(),
            getListings: vi.fn(),
            getListing: vi.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ListingsService,
                {
                    provide: DatabaseService,
                    useValue: mockDatabaseService,
                },
            ],
        }).compile();

        service = module.get<ListingsService>(ListingsService);
    });

    describe('create', () => {
        it('should create a new listing', () => {
            // Arrange
            const createDto = {
                ownerId: 'owner1',
                title: 'Test Listing',
                description: 'test desc',
                species: 'dog' as const,
                listingType: 'house-sitting' as const,
                startDate: '2025-07-01',
                endDate: '2025-07-02',
                sitterVerified: false,
                price: 10,
                breed: 'Bulldog',
                age: 3,
                size: 'medium',
                feeding: 'twice a day',
                medication: 'none',
            };
            const expectedListing: Listing = { id: 1, ...createDto };
            mockDatabaseService.addListing.mockReturnValue(expectedListing);

            // Act
            const result = service.create(createDto);

            // Assert
            expect(mockDatabaseService.addListing).toHaveBeenCalledWith(
                createDto,
            );
            expect(result).toEqual(expectedListing);
        });
    });

    describe('findAll', () => {
        it('should return all listings when no filters provided', () => {
            // Arrange
            const mockListings: Listing[] = [
                {
                    id: 1,
                    ownerId: 'owner1',
                    title: 'Test 1',
                    description: 'desc 1',
                    species: 'dog',
                    listingType: 'house-sitting',
                    startDate: '2025-07-01',
                    endDate: '2025-07-02',
                    sitterVerified: false,
                    price: 10,
                    breed: 'Bulldog',
                    age: 3,
                    size: 'medium',
                    feeding: 'twice a day',
                    medication: 'none',
                },
            ];
            mockDatabaseService.getListings.mockReturnValue(mockListings);

            // Act
            const result = service.findAll();

            // Assert
            expect(mockDatabaseService.getListings).toHaveBeenCalled();
            expect(result).toEqual(mockListings);
        });

        it('should filter listings by price', () => {
            // Arrange
            const mockListings: Listing[] = [
                {
                    id: 1,
                    ownerId: 'owner1',
                    title: 'Test 1',
                    description: 'desc 1',
                    species: 'dog',
                    listingType: 'house-sitting',
                    startDate: '2025-07-01',
                    endDate: '2025-07-02',
                    sitterVerified: false,
                    price: 10,
                    breed: 'Bulldog',
                    age: 3,
                    size: 'medium',
                    feeding: 'twice a day',
                    medication: 'none',
                },
                {
                    id: 2,
                    ownerId: 'owner2',
                    title: 'Test 2',
                    description: 'desc 2',
                    species: 'cat',
                    listingType: 'day-care',
                    startDate: '2025-08-01',
                    endDate: '2025-08-02',
                    sitterVerified: true,
                    price: 20,
                    breed: 'Siamese',
                    age: 2,
                    size: 'small',
                    feeding: 'once',
                    medication: 'none',
                },
            ];
            mockDatabaseService.getListings.mockReturnValue(mockListings);

            // Act
            const result = service.findAll({ price: 10 });

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0]?.price).toBe(10);
        });
    });

    describe('findByOwner', () => {
        it('should return listings for specific owner', () => {
            // Arrange
            const ownerId = 'owner1';
            const mockListings: Listing[] = [
                {
                    id: 1,
                    ownerId: 'owner1',
                    title: 'Test 1',
                    description: 'desc 1',
                    species: 'dog',
                    listingType: 'house-sitting',
                    startDate: '2025-07-01',
                    endDate: '2025-07-02',
                    sitterVerified: false,
                    price: 10,
                    breed: 'Bulldog',
                    age: 3,
                    size: 'medium',
                    feeding: 'twice a day',
                    medication: 'none',
                },
            ];
            mockDatabaseService.getListings.mockReturnValue(mockListings);

            // Act
            const result = service.findByOwner(ownerId);

            // Assert
            expect(result).toEqual(mockListings);
        });
    });

    describe('findOne', () => {
        it('should return a listing by id', () => {
            // Arrange
            const listingId = 1;
            const mockListing: Listing = {
                id: 1,
                ownerId: 'owner1',
                title: 'Test 1',
                description: 'desc 1',
                species: 'dog',
                listingType: 'house-sitting',
                startDate: '2025-07-01',
                endDate: '2025-07-02',
                sitterVerified: false,
                price: 10,
                breed: 'Bulldog',
                age: 3,
                size: 'medium',
                feeding: 'twice a day',
                medication: 'none',
            };
            mockDatabaseService.getListing.mockReturnValue(mockListing);

            // Act
            const result = service.findOne(listingId);

            // Assert
            expect(mockDatabaseService.getListing).toHaveBeenCalledWith(
                listingId,
            );
            expect(result).toEqual(mockListing);
        });

        it('should return undefined for non-existent listing', () => {
            // Arrange
            mockDatabaseService.getListing.mockReturnValue(undefined);

            // Act
            const result = service.findOne(999);

            // Assert
            expect(result).toBeUndefined();
        });
    });
});
