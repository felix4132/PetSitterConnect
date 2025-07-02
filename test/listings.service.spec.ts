import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Listing } from '../src/domain/listings/listing.entity.js';
import { DatabaseService } from '../src/infrastructure/database/database.service.js';
import { ListingsService } from '../src/modules/listings/listings.service.js';

describe('ListingsService', () => {
    let service: ListingsService;
    let mockDatabaseService: {
        addListing: ReturnType<typeof vi.fn>;
        getListings: ReturnType<typeof vi.fn>;
        getListing: ReturnType<typeof vi.fn>;
        getListingsWithFilters: ReturnType<typeof vi.fn>;
        getListingsByOwner: ReturnType<typeof vi.fn>;
        getListingWithApplications: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
        // Mock des DatabaseService
        mockDatabaseService = {
            addListing: vi.fn(),
            getListings: vi.fn(),
            getListing: vi.fn(),
            getListingsWithFilters: vi.fn(),
            getListingsByOwner: vi.fn(),
            getListingWithApplications: vi.fn(),
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
        it('should create a new listing', async () => {
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
            mockDatabaseService.addListing.mockResolvedValue(expectedListing);

            // Act
            const result = await service.create(createDto);

            // Assert
            expect(mockDatabaseService.addListing).toHaveBeenCalledWith(
                createDto,
            );
            expect(result).toEqual(expectedListing);
        });
    });

    describe('findAll', () => {
        it('should return all listings when no filters provided', async () => {
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
            mockDatabaseService.getListingsWithFilters.mockResolvedValue(
                mockListings,
            );

            // Act
            const result = await service.findAll();

            // Assert
            expect(
                mockDatabaseService.getListingsWithFilters,
            ).toHaveBeenCalled();
            expect(result).toEqual(mockListings);
        });

        it('should filter listings by price', async () => {
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
            mockDatabaseService.getListingsWithFilters.mockResolvedValue([
                mockListings[0],
            ]);

            // Act
            const result = await service.findAll({ price: 10 });

            // Assert
            expect(
                mockDatabaseService.getListingsWithFilters,
            ).toHaveBeenCalledWith({ price: 10 });
            expect(result).toHaveLength(1);
            expect(result[0]?.price).toBe(10);
        });
    });

    describe('findByOwner', () => {
        it('should return listings for a specific owner', async () => {
            // Arrange
            const ownerId = 'owner1';
            const mockListings = [
                {
                    id: 1,
                    ownerId: 'owner1',
                    title: 'Owner Listing',
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
                },
            ];

            mockDatabaseService.getListingsByOwner.mockResolvedValue(
                mockListings,
            );

            // Act
            const result = await service.findByOwner(ownerId);

            // Assert
            expect(mockDatabaseService.getListingsByOwner).toHaveBeenCalledWith(
                ownerId,
            );
            expect(result).toEqual(mockListings);
        });
    });

    describe('findOne', () => {
        it('should return a listing by id', async () => {
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
            mockDatabaseService.getListing.mockResolvedValue(mockListing);

            // Act
            const result = await service.findOne(listingId);

            // Assert
            expect(mockDatabaseService.getListing).toHaveBeenCalledWith(
                listingId,
            );
            expect(result).toEqual(mockListing);
        });

        it('should return null for non-existent listing', async () => {
            // Arrange
            mockDatabaseService.getListing.mockResolvedValue(null);

            // Act
            const result = await service.findOne(999);

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('findOneWithApplications', () => {
        it('should return listing with applications', async () => {
            // Arrange
            const listingId = 1;
            const mockListing = {
                id: 1,
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
                applications: [
                    {
                        id: 1,
                        listingId: 1,
                        sitterId: 'sitter1',
                        status: 'pending' as const,
                    },
                ],
            };

            mockDatabaseService.getListingWithApplications.mockResolvedValue(
                mockListing,
            );

            // Act
            const result = await service.findOneWithApplications(listingId);

            // Assert
            expect(
                mockDatabaseService.getListingWithApplications,
            ).toHaveBeenCalledWith(listingId);
            expect(result).toEqual(mockListing);
        });

        it('should return null for non-existent listing', async () => {
            // Arrange
            mockDatabaseService.getListingWithApplications.mockResolvedValue(
                null,
            );

            // Act
            const result = await service.findOneWithApplications(999);

            // Assert
            expect(result).toBeNull();
        });
    });
});
