import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Application } from '../src/domain/applications/application.entity.js';
import type { Listing } from '../src/domain/listings/listing.entity.js';
import { DatabaseService } from '../src/infrastructure/database/database.service.js';
import { ApplicationsService } from '../src/modules/applications/applications.service.js';

describe('ApplicationsService', () => {
    let service: ApplicationsService;
    let mockDatabaseService: {
        getListing: ReturnType<typeof vi.fn>;
        addApplication: ReturnType<typeof vi.fn>;
        updateApplicationStatus: ReturnType<typeof vi.fn>;
        getApplicationsBySitter: ReturnType<typeof vi.fn>;
        getApplicationsByListing: ReturnType<typeof vi.fn>;
        getApplicationsWithListings: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
        // Mock des DatabaseService
        mockDatabaseService = {
            getListing: vi.fn(),
            addApplication: vi.fn(),
            updateApplicationStatus: vi.fn(),
            getApplicationsBySitter: vi.fn(),
            getApplicationsByListing: vi.fn(),
            getApplicationsWithListings: vi.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ApplicationsService,
                {
                    provide: DatabaseService,
                    useValue: mockDatabaseService,
                },
            ],
        }).compile();

        service = module.get<ApplicationsService>(ApplicationsService);
    });

    describe('apply', () => {
        it('should create an application when listing exists', async () => {
            // Arrange
            const applyDto = { sitterId: 'sitter1', listingId: 1 };
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
            const expectedApplication: Application = {
                id: 1,
                listingId: 1,
                sitterId: 'sitter1',
                status: 'pending',
            };

            mockDatabaseService.getListing.mockResolvedValue(mockListing);
            mockDatabaseService.getApplicationsByListing.mockResolvedValue([]); // Keine bestehenden Applications
            mockDatabaseService.addApplication.mockResolvedValue(
                expectedApplication,
            );

            // Act
            const result = await service.apply(applyDto);

            // Assert
            expect(mockDatabaseService.getListing).toHaveBeenCalledWith(1);
            expect(
                mockDatabaseService.getApplicationsByListing,
            ).toHaveBeenCalledWith(1);
            expect(mockDatabaseService.addApplication).toHaveBeenCalledWith({
                listingId: 1,
                sitterId: 'sitter1',
            });
            expect(result).toEqual(expectedApplication);
        });

        it('should throw NotFoundException when listing does not exist', async () => {
            // Arrange
            const applyDto = { sitterId: 'sitter1', listingId: 999 };
            mockDatabaseService.getListing.mockResolvedValue(null);

            // Act & Assert
            await expect(service.apply(applyDto)).rejects.toThrow(
                'Listing with ID 999 not found',
            );
            expect(mockDatabaseService.getListing).toHaveBeenCalledWith(999);
            expect(mockDatabaseService.addApplication).not.toHaveBeenCalled();
        });

        it('should throw error when sitter has already applied', async () => {
            // Arrange
            const applyDto = { sitterId: 'sitter1', listingId: 1 };
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
            const existingApplication: Application = {
                id: 99,
                listingId: 1,
                sitterId: 'sitter1',
                status: 'pending',
            };

            mockDatabaseService.getListing.mockResolvedValue(mockListing);
            mockDatabaseService.getApplicationsByListing.mockResolvedValue([
                existingApplication,
            ]);

            // Act & Assert
            await expect(service.apply(applyDto)).rejects.toThrow(
                'Sitter sitter1 has already applied to listing 1',
            );
            expect(mockDatabaseService.getListing).toHaveBeenCalledWith(1);
            expect(
                mockDatabaseService.getApplicationsByListing,
            ).toHaveBeenCalledWith(1);
            expect(mockDatabaseService.addApplication).not.toHaveBeenCalled();
        });
    });

    describe('updateStatus', () => {
        it('should update application status', async () => {
            // Arrange
            const applicationId = 1;
            const newStatus = 'accepted';
            const updatedApplication: Application = {
                id: 1,
                listingId: 1,
                sitterId: 'sitter1',
                status: 'accepted',
            };

            // Mock other applications for the same listing (for auto-rejection logic)
            const otherApplications: Application[] = [
                {
                    id: 2,
                    listingId: 1,
                    sitterId: 'sitter2',
                    status: 'pending',
                },
                {
                    id: 3,
                    listingId: 1,
                    sitterId: 'sitter3',
                    status: 'pending',
                },
            ];

            mockDatabaseService.updateApplicationStatus.mockResolvedValue(
                updatedApplication,
            );
            mockDatabaseService.getApplicationsByListing.mockResolvedValue(
                otherApplications,
            );

            // Act
            const result = await service.updateStatus(applicationId, newStatus);

            // Assert
            expect(
                mockDatabaseService.updateApplicationStatus,
            ).toHaveBeenCalledWith(1, 'accepted');
            expect(
                mockDatabaseService.getApplicationsByListing,
            ).toHaveBeenCalledWith(1);
            // Should also reject other applications
            expect(
                mockDatabaseService.updateApplicationStatus,
            ).toHaveBeenCalledWith(2, 'rejected');
            expect(
                mockDatabaseService.updateApplicationStatus,
            ).toHaveBeenCalledWith(3, 'rejected');
            expect(result).toEqual(updatedApplication);
        });

        it('should throw NotFoundException for non-existent application', async () => {
            // Arrange
            mockDatabaseService.updateApplicationStatus.mockResolvedValue(null);

            // Act & Assert
            await expect(service.updateStatus(999, 'accepted')).rejects.toThrow(
                'Application with ID 999 not found',
            );
            expect(
                mockDatabaseService.updateApplicationStatus,
            ).toHaveBeenCalledWith(999, 'accepted');
        });
    });

    describe('applicationsBySitter', () => {
        it('should return applications for a specific sitter', async () => {
            // Arrange
            const sitterId = 'sitter1';
            const mockApplications: Application[] = [
                {
                    id: 1,
                    listingId: 1,
                    sitterId: 'sitter1',
                    status: 'pending',
                },
                {
                    id: 2,
                    listingId: 2,
                    sitterId: 'sitter1',
                    status: 'accepted',
                },
            ];

            mockDatabaseService.getApplicationsWithListings.mockResolvedValue(
                mockApplications,
            );

            // Act
            const result = await service.applicationsBySitter(sitterId);

            // Assert
            expect(
                mockDatabaseService.getApplicationsWithListings,
            ).toHaveBeenCalledWith('sitter1');
            expect(result).toEqual(mockApplications);
        });
    });

    describe('applicationsByListing', () => {
        it('should return applications for a specific listing', async () => {
            // Arrange
            const listingId = 1;
            const mockApplications: Application[] = [
                {
                    id: 1,
                    listingId: 1,
                    sitterId: 'sitter1',
                    status: 'pending',
                },
                {
                    id: 2,
                    listingId: 1,
                    sitterId: 'sitter2',
                    status: 'rejected',
                },
            ];

            mockDatabaseService.getApplicationsByListing.mockResolvedValue(
                mockApplications,
            );

            // Act
            const result = await service.applicationsByListing(listingId);

            // Assert
            expect(
                mockDatabaseService.getApplicationsByListing,
            ).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockApplications);
        });
    });

    describe('apply - Error Handling', () => {
        it('should throw InternalServerErrorException for unexpected database errors', async () => {
            // Arrange
            const applyDto = { sitterId: 'sitter1', listingId: 1 };
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

            mockDatabaseService.getListing.mockResolvedValue(mockListing);
            mockDatabaseService.getApplicationsByListing.mockResolvedValue([]);
            // Simulate unexpected database error
            mockDatabaseService.addApplication.mockRejectedValue(
                new Error('Unexpected database error'),
            );

            // Act & Assert
            await expect(service.apply(applyDto)).rejects.toThrow(
                'Failed to create application. Please try again.',
            );
        });
    });

    describe('updateStatus - Error Handling', () => {
        it('should throw InternalServerErrorException for unexpected database errors', async () => {
            // Arrange
            const applicationId = 1;
            const newStatus = 'accepted';

            // Simulate unexpected database error
            mockDatabaseService.updateApplicationStatus.mockRejectedValue(
                new Error('Unexpected database error'),
            );

            // Act & Assert
            await expect(
                service.updateStatus(applicationId, newStatus),
            ).rejects.toThrow(
                'Failed to update application status. Please try again.',
            );
        });

        it('should handle auto-rejection errors gracefully', async () => {
            // Arrange
            const applicationId = 1;
            const newStatus = 'accepted';
            const updatedApplication: Application = {
                id: 1,
                listingId: 1,
                sitterId: 'sitter1',
                status: 'accepted',
            };

            const otherApplications: Application[] = [
                {
                    id: 2,
                    listingId: 1,
                    sitterId: 'sitter2',
                    status: 'pending',
                },
            ];

            mockDatabaseService.updateApplicationStatus
                .mockResolvedValueOnce(updatedApplication) // First call succeeds
                .mockRejectedValueOnce(new Error('Auto-rejection failed')); // Second call fails

            mockDatabaseService.getApplicationsByListing.mockResolvedValue(
                otherApplications,
            );

            // Mock logger to check if error was logged
            const loggerErrorSpy = vi.spyOn(service['logger'], 'error');

            // Act & Assert
            await expect(
                service.updateStatus(applicationId, newStatus),
            ).rejects.toThrow(
                'Application accepted but failed to reject other applications. Please verify listing status.',
            );

            expect(loggerErrorSpy).toHaveBeenCalledWith(
                'Failed to auto-reject other applications for listing 1:',
                expect.any(Error),
            );
        });
    });
});
