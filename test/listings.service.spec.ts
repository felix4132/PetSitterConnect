import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Listing } from '../src/domain/listings/listing.entity.js';
import { DatabaseService } from '../src/infrastructure/database/database.service.js';
import type { CreateListingDto } from '../src/modules/listings/dto/create-listing.dto.js';
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
            const createDto: CreateListingDto = {
                ownerId: 'owner1',
                title: 'Test Listing',
                description: 'test desc',
                species: 'dog',
                listingType: ['walks'],
                startDate: '2025-08-15', // Future date
                endDate: '2025-08-25',   // Future date
                sitterVerified: false,
                price: 25,
            };

            const mockListing: Listing = {
                id: 1,
                ownerId: 'owner1',
                title: 'Test Listing',
                description: 'test desc',
                species: 'dog',
                listingType: ['walks'],
                startDate: '2025-08-15',
                endDate: '2025-08-25',
                sitterVerified: false,
                price: 25,
            };

            mockDatabaseService.addListing.mockResolvedValue(mockListing);

            // Act
            const result = await service.create(createDto);

            // Assert
            expect(result).toEqual(mockListing);
            expect(mockDatabaseService.addListing).toHaveBeenCalledWith({
                ownerId: 'owner1',
                title: 'Test Listing',
                description: 'test desc',
                species: 'dog',
                listingType: ['walks'],
                startDate: '2025-08-15',
                endDate: '2025-08-25',
                price: 25,
                sitterVerified: false,
                breed: undefined,
                age: undefined,
                size: undefined,
                feeding: undefined,
                medication: undefined,
            });
        });

        it('should throw BadRequestException for past start date', async () => {
            // Arrange
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const createDto: CreateListingDto = {
                ownerId: 'owner1',
                title: 'Test Listing',
                description: 'test desc',
                species: 'dog',
                listingType: ['walks'],
                startDate: yesterday.toISOString().split('T')[0], // Past date
                endDate: '2025-08-25',
                sitterVerified: false,
                price: 25,
            };

            // Act & Assert
            await expect(service.create(createDto)).rejects.toThrow(
                'Start date cannot be in the past',
            );
        });

        it('should throw BadRequestException when end date is before start date', async () => {
            // Arrange
            const createDto: CreateListingDto = {
                ownerId: 'owner1',
                title: 'Test Listing',
                description: 'test desc',
                species: 'dog',
                listingType: ['walks'],
                startDate: '2025-08-20',
                endDate: '2025-08-15', // End date before start date
                sitterVerified: false,
                price: 25,
            };

            // Act & Assert
            await expect(service.create(createDto)).rejects.toThrow(
                'End date must be after start date',
            );
        });

        it('should throw BadRequestException when end date equals start date', async () => {
            // Arrange
            const createDto: CreateListingDto = {
                ownerId: 'owner1',
                title: 'Test Listing',
                description: 'test desc',
                species: 'dog',
                listingType: ['walks'],
                startDate: '2025-08-20',
                endDate: '2025-08-20', // Same date
                sitterVerified: false,
                price: 25,
            };

            // Act & Assert
            await expect(service.create(createDto)).rejects.toThrow(
                'End date must be after start date',
            );
        });

        it('should throw InternalServerErrorException for database errors', async () => {
            // Arrange
            const createDto: CreateListingDto = {
                ownerId: 'owner1',
                title: 'Test Listing',
                description: 'test desc',
                species: 'dog',
                listingType: ['walks'],
                startDate: '2025-07-15',
                endDate: '2025-07-25',
                sitterVerified: false,
                price: 25,
            };

            mockDatabaseService.addListing.mockRejectedValue(
                new Error('Database error'),
            );

            // Act & Assert
            await expect(service.create(createDto)).rejects.toThrow(
                'Failed to create listing. Please try again.',
            );
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
                    listingType: ['house-sitting'],
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
                    listingType: ['house-sitting'],
                    startDate: '2025-07-01',
                    endDate: '2025-07-02',
                    sitterVerified: false,
                    price: 10,
                },
            ];

            const filters = { price: 10 };
            mockDatabaseService.getListingsWithFilters.mockResolvedValue(
                mockListings,
            );

            // Act
            const result = await service.findAll(filters);

            // Assert
            expect(
                mockDatabaseService.getListingsWithFilters,
            ).toHaveBeenCalledWith(filters);
            expect(result).toEqual(mockListings);
        });

        it('should throw InternalServerErrorException for database errors in findAll', async () => {
            // Arrange
            mockDatabaseService.getListingsWithFilters.mockRejectedValue(
                new Error('Database error'),
            );

            // Act & Assert
            await expect(service.findAll()).rejects.toThrow(
                'Failed to retrieve listings. Please try again.',
            );
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
                    listingType: ['house-sitting'],
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
                listingType: ['house-sitting'],
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
                listingType: ['house-sitting'],
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
