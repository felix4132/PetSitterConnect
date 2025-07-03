import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Listing } from '../src/domain/listings/listing.entity.ts';
import { CreateListingDto } from '../src/modules/listings/dto/create-listing.dto.ts';
import { FindListingsQueryDto } from '../src/modules/listings/dto/find-listings-query.dto.ts';
import { ListingsController } from '../src/modules/listings/listings.controller.ts';
import { ListingsService } from '../src/modules/listings/listings.service.ts';

describe('ListingsController', () => {
    let controller: ListingsController;
    let mockListingsService: {
        create: ReturnType<typeof vi.fn>;
        findAll: ReturnType<typeof vi.fn>;
        findOne: ReturnType<typeof vi.fn>;
        findByOwner: ReturnType<typeof vi.fn>;
        findOneWithApplications: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
        // Mock des ListingsService
        mockListingsService = {
            create: vi.fn(),
            findAll: vi.fn(),
            findOne: vi.fn(),
            findByOwner: vi.fn(),
            findOneWithApplications: vi.fn(),
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
        it('should create a new listing', async () => {
            // Arrange
            const createDto: CreateListingDto = {
                ownerId: 'owner1',
                title: 'Test Listing',
                description: 'test desc',
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
            const expectedListing: Listing = {
                id: 1,
                ownerId: createDto.ownerId,
                title: createDto.title,
                description: createDto.description,
                species: createDto.species,
                listingType: createDto.listingType,
                startDate: createDto.startDate,
                endDate: createDto.endDate,
                sitterVerified: createDto.sitterVerified,
                price: createDto.price,
                breed: createDto.breed,
                age: createDto.age,
                size: createDto.size,
                feeding: createDto.feeding,
                medication: createDto.medication,
            };
            mockListingsService.create.mockResolvedValue(expectedListing);

            // Act
            const result = await controller.create(createDto);

            // Assert
            expect(mockListingsService.create).toHaveBeenCalledWith(createDto);
            expect(result).toEqual(expectedListing);
        });
    });

    describe('find', () => {
        it('should return all listings when no query parameters', async () => {
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
            mockListingsService.findAll.mockResolvedValue(mockListings);

            // Act
            const result = await controller.find({});

            // Assert
            expect(mockListingsService.findAll).toHaveBeenCalledWith({});
            expect(result).toEqual(mockListings);
        });

        it('should parse query parameters correctly', async () => {
            // Arrange - Using already transformed values as they would come from ValidationPipe
            const queryParams: FindListingsQueryDto = {
                price: 10,
                age: 3,
                sitterVerified: true,
                ownerId: 'owner1',
            };
            const expectedParsedQuery = {
                price: 10,
                age: 3,
                sitterVerified: true,
                ownerId: 'owner1',
            };
            mockListingsService.findAll.mockResolvedValue([]);

            // Act
            await controller.find(queryParams);

            // Assert
            expect(mockListingsService.findAll).toHaveBeenCalledWith(
                expectedParsedQuery,
            );
        });

        it('should handle empty query parameters', async () => {
            // Arrange
            const queryParams: FindListingsQueryDto = {};
            mockListingsService.findAll.mockResolvedValue([]);

            // Act
            await controller.find(queryParams);

            // Assert
            expect(mockListingsService.findAll).toHaveBeenCalledWith({});
        });

        it('should parse boolean parameters correctly', async () => {
            // Arrange
            const queryParams: FindListingsQueryDto = {
                sitterVerified: false,
            };
            const expectedParsedQuery = {
                sitterVerified: false,
            };
            mockListingsService.findAll.mockResolvedValue([]);

            // Act
            await controller.find(queryParams);

            // Assert
            expect(mockListingsService.findAll).toHaveBeenCalledWith(
                expectedParsedQuery,
            );
        });

        it('should parse id query parameter correctly', async () => {
            // Arrange
            const queryParams: FindListingsQueryDto = {
                id: 123,
            };
            const expectedParsedQuery = {
                id: 123,
            };
            mockListingsService.findAll.mockResolvedValue([]);

            // Act
            await controller.find(queryParams);

            // Assert
            expect(mockListingsService.findAll).toHaveBeenCalledWith(
                expectedParsedQuery,
            );
        });

        it('should handle valid number transformation', async () => {
            // Arrange
            const queryParams: FindListingsQueryDto = {
                price: 25.5,
                age: 3,
            };
            mockListingsService.findAll.mockResolvedValue([]);

            // Act
            await controller.find(queryParams);

            // Assert
            expect(mockListingsService.findAll).toHaveBeenCalledWith(
                queryParams,
            );
        });

        it('should parse species query parameter correctly', async () => {
            // Arrange
            const queryParams: FindListingsQueryDto = {
                species: 'cat',
            };
            const expectedParsedQuery = {
                species: 'cat',
            };
            mockListingsService.findAll.mockResolvedValue([]);

            // Act
            await controller.find(queryParams);

            // Assert
            expect(mockListingsService.findAll).toHaveBeenCalledWith(
                expectedParsedQuery,
            );
        });

        it('should parse listingType query parameter correctly', async () => {
            // Arrange
            const queryParams: FindListingsQueryDto = {
                listingType: ['drop-in-visit'],
            };
            const expectedParsedQuery = {
                listingType: ['drop-in-visit'],
            };
            mockListingsService.findAll.mockResolvedValue([]);

            // Act
            await controller.find(queryParams);

            // Assert
            expect(mockListingsService.findAll).toHaveBeenCalledWith(
                expectedParsedQuery,
            );
        });

        it('should parse all string fields correctly', async () => {
            // Arrange
            const queryParams: FindListingsQueryDto = {
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
            mockListingsService.findAll.mockResolvedValue([]);

            // Act
            await controller.find(queryParams);

            // Assert
            expect(mockListingsService.findAll).toHaveBeenCalledWith(
                expectedParsedQuery,
            );
        });

        it('should handle complex query with all parameter types', async () => {
            // Arrange
            const queryParams: FindListingsQueryDto = {
                id: 42,
                price: 25.5,
                age: 5,
                sitterVerified: false,
                ownerId: 'owner123',
                species: 'bird',
                listingType: ['day-care'],
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
                listingType: ['day-care'],
                title: 'Beautiful Parrot',
                breed: 'African Grey',
            };
            mockListingsService.findAll.mockResolvedValue([]);

            // Act
            await controller.find(queryParams);

            // Assert
            expect(mockListingsService.findAll).toHaveBeenCalledWith(
                expectedParsedQuery,
            );
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
            mockListingsService.findOne.mockResolvedValue(mockListing);

            // Act
            const result = await controller.findOne(listingId);

            // Assert
            expect(mockListingsService.findOne).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockListing);
        });

        it('should throw NotFoundException when listing not found', async () => {
            // Arrange
            const listingId = 999;
            mockListingsService.findOne.mockResolvedValue(null);

            // Act & Assert
            await expect(controller.findOne(listingId)).rejects.toThrow(
                'Listing with ID 999 not found',
            );
            expect(mockListingsService.findOne).toHaveBeenCalledWith(999);
        });
    });

    describe('findByOwner', () => {
        it('should return listings for a specific owner', async () => {
            // Arrange
            const ownerId = 'owner1';
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
            mockListingsService.findByOwner.mockResolvedValue(mockListings);

            // Act
            const result = await controller.findByOwner(ownerId);

            // Assert
            expect(mockListingsService.findByOwner).toHaveBeenCalledWith(
                ownerId,
            );
            expect(result).toEqual(mockListings);
        });
    });

    describe('findOneWithApplications', () => {
        it('should return a listing with applications by id', async () => {
            // Arrange
            const id = 1;
            const mockListing: Listing = {
                id: 1,
                ownerId: 'owner1',
                title: 'Test Listing',
                description: 'test desc',
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
            mockListingsService.findOneWithApplications.mockResolvedValue(
                mockListing,
            );

            // Act
            const result = await controller.findOneWithApplications(id);

            // Assert
            expect(
                mockListingsService.findOneWithApplications,
            ).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockListing);
        });

        it('should throw NotFoundException when listing with applications not found', async () => {
            // Arrange
            const id = 999;
            mockListingsService.findOneWithApplications.mockResolvedValue(null);

            // Act & Assert
            await expect(
                controller.findOneWithApplications(id),
            ).rejects.toThrow('Listing with ID 999 not found');
            expect(
                mockListingsService.findOneWithApplications,
            ).toHaveBeenCalledWith(999);
        });
    });
});
