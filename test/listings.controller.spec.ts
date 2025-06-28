import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Listing } from '../src/domain/listings/listing.entity.ts';
import { ListingsController } from '../src/modules/listings/listings.controller.ts';
import {
    ListingsService,
    type CreateListingDto,
} from '../src/modules/listings/listings.service.ts';

describe('ListingsController', () => {
    let controller: ListingsController;
    let mockListingsService: {
        create: ReturnType<typeof vi.fn>;
        findAll: ReturnType<typeof vi.fn>;
        findOne: ReturnType<typeof vi.fn>;
        findByOwner: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
        // Mock des ListingsService
        mockListingsService = {
            create: vi.fn(),
            findAll: vi.fn(),
            findOne: vi.fn(),
            findByOwner: vi.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [ListingsController],
            providers: [
                {
                    provide: ListingsService,
                    useValue: mockListingsService,
                },
            ],
        }).compile();

        controller = module.get<ListingsController>(ListingsController);
    });

    describe('create', () => {
        it('should create a new listing', () => {
            // Arrange
            const createDto: CreateListingDto = {
                ownerId: 'owner1',
                title: 'Test Listing',
                description: 'test desc',
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
            const expectedListing: Listing = { id: 1, ...createDto };
            mockListingsService.create.mockReturnValue(expectedListing);

            // Act
            const result = controller.create(createDto);

            // Assert
            expect(mockListingsService.create).toHaveBeenCalledWith(createDto);
            expect(result).toEqual(expectedListing);
        });
    });

    describe('find', () => {
        it('should return all listings when no query parameters', () => {
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
            mockListingsService.findAll.mockReturnValue(mockListings);

            // Act
            const result = controller.find({});

            // Assert
            expect(mockListingsService.findAll).toHaveBeenCalledWith({});
            expect(result).toEqual(mockListings);
        });

        it('should parse query parameters correctly', () => {
            // Arrange
            const queryParams = {
                price: '10',
                age: '3',
                sitterVerified: 'true',
                ownerId: 'owner1',
            };
            const expectedParsedQuery = {
                price: 10,
                age: 3,
                sitterVerified: true,
                ownerId: 'owner1',
            };
            mockListingsService.findAll.mockReturnValue([]);

            // Act
            controller.find(queryParams);

            // Assert
            expect(mockListingsService.findAll).toHaveBeenCalledWith(
                expectedParsedQuery,
            );
        });

        it('should ignore invalid numeric parameters', () => {
            // Arrange
            const queryParams = {
                price: 'invalid',
                age: 'notanumber',
            };
            mockListingsService.findAll.mockReturnValue([]);

            // Act
            controller.find(queryParams);

            // Assert
            expect(mockListingsService.findAll).toHaveBeenCalledWith({});
        });

        it('should parse boolean parameters correctly', () => {
            // Arrange
            const queryParams = {
                sitterVerified: 'false',
            };
            const expectedParsedQuery = {
                sitterVerified: false,
            };
            mockListingsService.findAll.mockReturnValue([]);

            // Act
            controller.find(queryParams);

            // Assert
            expect(mockListingsService.findAll).toHaveBeenCalledWith(
                expectedParsedQuery,
            );
        });

        it('should parse id query parameter correctly', () => {
            // Arrange
            const queryParams = {
                id: '123',
            };
            const expectedParsedQuery = {
                id: 123,
            };
            mockListingsService.findAll.mockReturnValue([]);

            // Act
            controller.find(queryParams);

            // Assert
            expect(mockListingsService.findAll).toHaveBeenCalledWith(
                expectedParsedQuery,
            );
        });

        it('should ignore invalid id parameter', () => {
            // Arrange
            const queryParams = {
                id: 'invalid-id',
            };
            mockListingsService.findAll.mockReturnValue([]);

            // Act
            controller.find(queryParams);

            // Assert
            expect(mockListingsService.findAll).toHaveBeenCalledWith({});
        });

        it('should parse species query parameter correctly', () => {
            // Arrange
            const queryParams = {
                species: 'cat',
            };
            const expectedParsedQuery = {
                species: 'cat',
            };
            mockListingsService.findAll.mockReturnValue([]);

            // Act
            controller.find(queryParams);

            // Assert
            expect(mockListingsService.findAll).toHaveBeenCalledWith(
                expectedParsedQuery,
            );
        });

        it('should parse listingType query parameter correctly', () => {
            // Arrange
            const queryParams = {
                listingType: 'drop-in-visit',
            };
            const expectedParsedQuery = {
                listingType: 'drop-in-visit',
            };
            mockListingsService.findAll.mockReturnValue([]);

            // Act
            controller.find(queryParams);

            // Assert
            expect(mockListingsService.findAll).toHaveBeenCalledWith(
                expectedParsedQuery,
            );
        });

        it('should parse all string fields correctly', () => {
            // Arrange
            const queryParams = {
                title: 'Test Title',
                description: 'Test Description',
                startDate: '2025-01-01',
                endDate: '2025-01-02',
                breed: 'Golden Retriever',
                size: 'large',
                feeding: 'twice a day',
                medication: 'none',
            };
            const expectedParsedQuery = {
                title: 'Test Title',
                description: 'Test Description',
                startDate: '2025-01-01',
                endDate: '2025-01-02',
                breed: 'Golden Retriever',
                size: 'large',
                feeding: 'twice a day',
                medication: 'none',
            };
            mockListingsService.findAll.mockReturnValue([]);

            // Act
            controller.find(queryParams);

            // Assert
            expect(mockListingsService.findAll).toHaveBeenCalledWith(
                expectedParsedQuery,
            );
        });

        it('should handle complex query with all parameter types', () => {
            // Arrange
            const queryParams = {
                id: '42',
                price: '25.50',
                age: '5',
                sitterVerified: 'false',
                ownerId: 'owner123',
                species: 'bird',
                listingType: 'day-care',
                title: 'Beautiful Parrot',
                breed: 'African Grey',
            };
            const expectedParsedQuery = {
                id: 42,
                price: 25.5,
                age: 5,
                sitterVerified: false,
                ownerId: 'owner123',
                species: 'bird',
                listingType: 'day-care',
                title: 'Beautiful Parrot',
                breed: 'African Grey',
            };
            mockListingsService.findAll.mockReturnValue([]);

            // Act
            controller.find(queryParams);

            // Assert
            expect(mockListingsService.findAll).toHaveBeenCalledWith(
                expectedParsedQuery,
            );
        });
    });

    describe('findOne', () => {
        it('should return a listing by id', () => {
            // Arrange
            const listingId = '1';
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
            mockListingsService.findOne.mockReturnValue(mockListing);

            // Act
            const result = controller.findOne(listingId);

            // Assert
            expect(mockListingsService.findOne).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockListing);
        });
    });

    describe('findByOwner', () => {
        it('should return listings for a specific owner', () => {
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
            mockListingsService.findByOwner.mockReturnValue(mockListings);

            // Act
            const result = controller.findByOwner(ownerId);

            // Assert
            expect(mockListingsService.findByOwner).toHaveBeenCalledWith(
                ownerId,
            );
            expect(result).toEqual(mockListings);
        });
    });
});
