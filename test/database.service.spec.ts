import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Application } from '../src/domain/applications/application.entity.js';
import { Listing } from '../src/domain/listings/listing.entity.js';
import { DatabaseService } from '../src/infrastructure/database/database.service.js';

describe('DatabaseService', () => {
    let service: DatabaseService;
    let listingRepository: Repository<Listing>;
    let applicationRepository: Repository<Application>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DatabaseService,
                {
                    provide: getRepositoryToken(Listing),
                    useValue: {
                        create: vi.fn(),
                        save: vi.fn(),
                        findOneBy: vi.fn(),
                        find: vi.fn(),
                        findOne: vi.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Application),
                    useValue: {
                        create: vi.fn(),
                        save: vi.fn(),
                        findOneBy: vi.fn(),
                        findBy: vi.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<DatabaseService>(DatabaseService);
        listingRepository = module.get<Repository<Listing>>(
            getRepositoryToken(Listing),
        );
        applicationRepository = module.get<Repository<Application>>(
            getRepositoryToken(Application),
        );
    });

    describe('Listings', () => {
        describe('addListing', () => {
            it('should add a new listing', async () => {
                // Arrange
                const listingData = {
                    ownerId: 'owner1',
                    title: 'Test Listing',
                    description: 'test desc',
                    species: 'dog' as const,
                    listingType: ['house-sitting'] as 'house-sitting'[],
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
                const expectedListing = { id: 1, ...listingData };

                const createSpy = vi
                    .fn()
                    .mockReturnValue(expectedListing as any);
                const saveSpy = vi
                    .fn()
                    .mockResolvedValue(expectedListing as any);

                listingRepository.create = createSpy;
                listingRepository.save = saveSpy;

                // Act
                const result = await service.addListing(listingData);

                // Assert
                expect(createSpy).toHaveBeenCalledWith(listingData);
                expect(saveSpy).toHaveBeenCalled();
                expect(result).toEqual(expectedListing);
            });
        });

        describe('getListing', () => {
            it('should return listing by id', async () => {
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
                };

                const findOneBySpyResult = vi
                    .fn()
                    .mockResolvedValue(mockListing as any);
                listingRepository.findOneBy = findOneBySpyResult;

                // Act
                const result = await service.getListing(listingId);

                // Assert
                expect(findOneBySpyResult).toHaveBeenCalledWith({
                    id: listingId,
                });
                expect(result).toEqual(mockListing);
            });

            it('should return null for non-existent listing', async () => {
                // Arrange
                const findOneBySpyResult = vi.fn().mockResolvedValue(null);
                listingRepository.findOneBy = findOneBySpyResult;

                // Act
                const result = await service.getListing(999);

                // Assert
                expect(result).toBeNull();
            });
        });

        describe('getListings', () => {
            it('should return all listings with pagination', async () => {
                // Arrange
                const mockListings = [
                    {
                        id: 1,
                        ownerId: 'owner1',
                        title: 'Test Listing 1',
                        description: 'test desc 1',
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

                const findSpyResult = vi
                    .fn()
                    .mockResolvedValue(mockListings as any);
                listingRepository.find = findSpyResult;

                // Act
                const result = await service.getListings();

                // Assert
                expect(findSpyResult).toHaveBeenCalledWith({
                    take: 100,
                    order: { id: 'DESC' },
                });
                expect(result).toEqual(mockListings);
            });
        });

        describe('getListingsWithFilters', () => {
            it('should return filtered listings with database-level filtering', async () => {
                // Arrange
                const filters = { species: 'dog' as const, price: 10 };
                const mockListings = [
                    {
                        id: 1,
                        ownerId: 'owner1',
                        title: 'Dog Listing',
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

                const findSpyResult = vi
                    .fn()
                    .mockResolvedValue(mockListings as any);
                listingRepository.find = findSpyResult;

                // Act
                const result = await service.getListingsWithFilters(filters);

                // Assert
                expect(findSpyResult).toHaveBeenCalledWith({
                    where: filters,
                    order: { id: 'DESC' },
                    take: 100,
                });
                expect(result).toEqual(mockListings);
            });

            it('should return all listings when no filters provided', async () => {
                // Arrange
                const mockListings = [
                    {
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
                    },
                ];

                const findSpyResult = vi
                    .fn()
                    .mockResolvedValue(mockListings as any);
                listingRepository.find = findSpyResult;

                // Act
                const result = await service.getListingsWithFilters();

                // Assert
                expect(findSpyResult).toHaveBeenCalledWith({
                    where: {},
                    order: { id: 'DESC' },
                    take: 100,
                });
                expect(result).toEqual(mockListings);
            });

            it('should cast sitterVerified string "true" to boolean true', async () => {
                const filters = { sitterVerified: 'true' };
                const findSpyResult = vi.fn().mockResolvedValue([]);
                listingRepository.find = findSpyResult;
                await service.getListingsWithFilters(filters as any);
                expect(findSpyResult).toHaveBeenCalledWith({
                    where: { sitterVerified: true },
                    order: { id: 'DESC' },
                    take: 100,
                });
            });
            it('should cast sitterVerified string "false" to boolean false', async () => {
                const filters = { sitterVerified: 'false' };
                const findSpyResult = vi.fn().mockResolvedValue([]);
                listingRepository.find = findSpyResult;
                await service.getListingsWithFilters(filters as any);
                expect(findSpyResult).toHaveBeenCalledWith({
                    where: { sitterVerified: false },
                    order: { id: 'DESC' },
                    take: 100,
                });
            });
            it('should ignore sitterVerified if not boolean or "true"/"false"', async () => {
                const filters = { sitterVerified: 'not-a-bool' };
                const findSpyResult = vi.fn().mockResolvedValue([]);
                listingRepository.find = findSpyResult;
                await service.getListingsWithFilters(filters as any);
                expect(findSpyResult).toHaveBeenCalledWith({
                    where: {},
                    order: { id: 'DESC' },
                    take: 100,
                });
            });
            it('should cast price, age, id string numbers to numbers', async () => {
                const filters = { price: '10', age: '5', id: '3' };
                const findSpyResult = vi.fn().mockResolvedValue([]);
                listingRepository.find = findSpyResult;
                await service.getListingsWithFilters(filters as any);
                expect(findSpyResult).toHaveBeenCalledWith({
                    where: { price: 10, age: 5, id: 3 },
                    order: { id: 'DESC' },
                    take: 100,
                });
            });
            it('should ignore price, age, id if not a number', async () => {
                const filters = {
                    price: 'not-a-number',
                    age: 'NaN',
                    id: 'foo',
                };
                const findSpyResult = vi.fn().mockResolvedValue([]);
                listingRepository.find = findSpyResult;
                await service.getListingsWithFilters(filters as any);
                expect(findSpyResult).toHaveBeenCalledWith({
                    where: {},
                    order: { id: 'DESC' },
                    take: 100,
                });
            });
            it('should handle sitterVerified as boolean true', async () => {
                const filters = { sitterVerified: true };
                const findSpyResult = vi.fn().mockResolvedValue([]);
                listingRepository.find = findSpyResult;
                await service.getListingsWithFilters(filters as any);
                expect(findSpyResult).toHaveBeenCalledWith({
                    where: { sitterVerified: true },
                    order: { id: 'DESC' },
                    take: 100,
                });
            });
            it('should handle price, age, id as native numbers', async () => {
                const filters = { price: 25, age: 3, id: 5 };
                const findSpyResult = vi.fn().mockResolvedValue([]);
                listingRepository.find = findSpyResult;
                await service.getListingsWithFilters(filters as any);
                expect(findSpyResult).toHaveBeenCalledWith({
                    where: { price: 25, age: 3, id: 5 },
                    order: { id: 'DESC' },
                    take: 100,
                });
            });
        });

        describe('getListingsByOwner', () => {
            it('should return listings for specific owner with database filtering', async () => {
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

                const findSpyResult = vi
                    .fn()
                    .mockResolvedValue(mockListings as any);
                listingRepository.find = findSpyResult;

                // Act
                const result = await service.getListingsByOwner(ownerId);

                // Assert
                expect(findSpyResult).toHaveBeenCalledWith({
                    where: { ownerId },
                    order: { id: 'DESC' },
                });
                expect(result).toEqual(mockListings);
            });
        });

        describe('getListingWithApplications', () => {
            it('should return listing with related applications', async () => {
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

                const findOneSpyResult = vi
                    .fn()
                    .mockResolvedValue(mockListing as any);
                listingRepository.findOne = findOneSpyResult;

                // Act
                const result =
                    await service.getListingWithApplications(listingId);

                // Assert
                expect(findOneSpyResult).toHaveBeenCalledWith({
                    where: { id: listingId },
                    relations: ['applications'],
                });
                expect(result).toEqual(mockListing);
            });

            it('should return null for non-existent listing', async () => {
                // Arrange
                const findOneSpyResult = vi.fn().mockResolvedValue(null);
                listingRepository.findOne = findOneSpyResult;

                // Act
                const result = await service.getListingWithApplications(999);

                // Assert
                expect(result).toBeNull();
            });
        });
    });

    describe('Applications', () => {
        describe('getApplicationsWithListings', () => {
            it('should return applications with related listing data', async () => {
                // Arrange
                const sitterId = 'sitter1';
                const mockApplications = [
                    {
                        id: 1,
                        listingId: 1,
                        sitterId: 'sitter1',
                        status: 'pending' as const,
                        listing: {
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
                        },
                    },
                ];

                const findSpyResult = vi
                    .fn()
                    .mockResolvedValue(mockApplications as any);
                applicationRepository.find = findSpyResult;

                // Act
                const result =
                    await service.getApplicationsWithListings(sitterId);

                // Assert
                expect(findSpyResult).toHaveBeenCalledWith({
                    where: { sitterId },
                    relations: ['listing'],
                    order: { id: 'DESC' },
                });
                expect(result).toEqual(mockApplications);
            });
        });
        describe('addApplication', () => {
            it('should add a new application', async () => {
                // Arrange
                const applicationData = {
                    listingId: 1,
                    sitterId: 'sitter1',
                };
                const expectedApplication = {
                    id: 1,
                    status: 'pending',
                    ...applicationData,
                };

                const createSpyResult = vi
                    .fn()
                    .mockReturnValue(expectedApplication as any);
                const saveSpyResult = vi
                    .fn()
                    .mockResolvedValue(expectedApplication as any);

                applicationRepository.create = createSpyResult;
                applicationRepository.save = saveSpyResult;

                // Act
                const result = await service.addApplication(applicationData);

                // Assert
                expect(createSpyResult).toHaveBeenCalledWith({
                    ...applicationData,
                    status: 'pending',
                });
                expect(saveSpyResult).toHaveBeenCalled();
                expect(result).toEqual(expectedApplication);
            });
        });

        describe('updateApplicationStatus', () => {
            it('should update application status', async () => {
                // Arrange
                const applicationId = 1;
                const newStatus = 'accepted';
                const application = {
                    id: 1,
                    listingId: 1,
                    sitterId: 'sitter1',
                    status: 'pending' as const,
                };
                const updatedApplication = {
                    ...application,
                    status: newStatus,
                };

                const findOneBySpyResult = vi
                    .fn()
                    .mockResolvedValue(application as any);
                const saveSpyResult = vi
                    .fn()
                    .mockResolvedValue(updatedApplication as any);

                applicationRepository.findOneBy = findOneBySpyResult;
                applicationRepository.save = saveSpyResult;

                // Act
                const result = await service.updateApplicationStatus(
                    applicationId,
                    newStatus,
                );

                // Assert
                expect(findOneBySpyResult).toHaveBeenCalledWith({
                    id: applicationId,
                });
                expect(saveSpyResult).toHaveBeenCalledWith(updatedApplication);
                expect(result?.status).toBe(newStatus);
            });

            it('should return null for non-existent application', async () => {
                // Arrange
                const findOneBySpyResult = vi.fn().mockResolvedValue(null);
                applicationRepository.findOneBy = findOneBySpyResult;

                // Act
                const result = await service.updateApplicationStatus(
                    999,
                    'accepted',
                );

                // Assert
                expect(result).toBeNull();
            });
        });

        describe('getApplicationsBySitter', () => {
            it('should return applications for specific sitter', async () => {
                // Arrange
                const sitterId = 'sitter1';
                const mockApplications = [
                    {
                        id: 1,
                        listingId: 1,
                        sitterId: 'sitter1',
                        status: 'pending' as const,
                    },
                ];

                const findBySpyResult = vi
                    .fn()
                    .mockResolvedValue(mockApplications as any);
                applicationRepository.findBy = findBySpyResult;

                // Act
                const result = await service.getApplicationsBySitter(sitterId);

                // Assert
                expect(findBySpyResult).toHaveBeenCalledWith({
                    sitterId,
                });
                expect(result).toEqual(mockApplications);
            });
        });

        describe('getApplicationsByListing', () => {
            it('should return applications for specific listing', async () => {
                // Arrange
                const listingId = 1;
                const mockApplications = [
                    {
                        id: 1,
                        listingId: 1,
                        sitterId: 'sitter1',
                        status: 'pending' as const,
                    },
                ];

                const findBySpyResult = vi
                    .fn()
                    .mockResolvedValue(mockApplications as any);
                applicationRepository.findBy = findBySpyResult;

                // Act
                const result =
                    await service.getApplicationsByListing(listingId);

                // Assert
                expect(findBySpyResult).toHaveBeenCalledWith({
                    listingId,
                });
                expect(result).toEqual(mockApplications);
            });
        });
    });
});
