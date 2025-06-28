import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Application } from '../src/domain/applications/application.entity.ts';
import type { Listing } from '../src/domain/listings/listing.entity.ts';
import { DatabaseService } from '../src/infrastructure/database/database.service.ts';
import { ApplicationsService } from '../src/modules/applications/applications.service.ts';

describe('ApplicationsService', () => {
    let service: ApplicationsService;
    let mockDatabaseService: {
        getListing: ReturnType<typeof vi.fn>;
        addApplication: ReturnType<typeof vi.fn>;
        updateApplicationStatus: ReturnType<typeof vi.fn>;
        getApplicationsBySitter: ReturnType<typeof vi.fn>;
        getApplicationsByListing: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
        // Mock des DatabaseService
        mockDatabaseService = {
            getListing: vi.fn(),
            addApplication: vi.fn(),
            updateApplicationStatus: vi.fn(),
            getApplicationsBySitter: vi.fn(),
            getApplicationsByListing: vi.fn(),
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
        it('should create an application when listing exists', () => {
            // Arrange
            const applyDto = { sitterId: 'sitter1', listingId: 1 };
            const mockListing: Listing = {
                id: 1,
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
            const expectedApplication: Application = {
                id: 1,
                listingId: 1,
                sitterId: 'sitter1',
                status: 'pending',
            };

            mockDatabaseService.getListing.mockReturnValue(mockListing);
            mockDatabaseService.addApplication.mockReturnValue(
                expectedApplication,
            );

            // Act
            const result = service.apply(applyDto);

            // Assert
            expect(mockDatabaseService.getListing).toHaveBeenCalledWith(1);
            expect(mockDatabaseService.addApplication).toHaveBeenCalledWith({
                listingId: 1,
                sitterId: 'sitter1',
            });
            expect(result).toEqual(expectedApplication);
        });

        it('should return undefined when listing does not exist', () => {
            // Arrange
            const applyDto = { sitterId: 'sitter1', listingId: 999 };
            mockDatabaseService.getListing.mockReturnValue(undefined);

            // Act
            const result = service.apply(applyDto);

            // Assert
            expect(mockDatabaseService.getListing).toHaveBeenCalledWith(999);
            expect(mockDatabaseService.addApplication).not.toHaveBeenCalled();
            expect(result).toBeUndefined();
        });
    });

    describe('updateStatus', () => {
        it('should update application status', () => {
            // Arrange
            const applicationId = 1;
            const newStatus = 'accepted';
            const updatedApplication: Application = {
                id: 1,
                listingId: 1,
                sitterId: 'sitter1',
                status: 'accepted',
            };

            mockDatabaseService.updateApplicationStatus.mockReturnValue(
                updatedApplication,
            );

            // Act
            const result = service.updateStatus(applicationId, newStatus);

            // Assert
            expect(
                mockDatabaseService.updateApplicationStatus,
            ).toHaveBeenCalledWith(1, 'accepted');
            expect(result).toEqual(updatedApplication);
        });

        it('should return undefined for non-existent application', () => {
            // Arrange
            mockDatabaseService.updateApplicationStatus.mockReturnValue(
                undefined,
            );

            // Act
            const result = service.updateStatus(999, 'accepted');

            // Assert
            expect(result).toBeUndefined();
        });
    });

    describe('applicationsBySitter', () => {
        it('should return applications for a specific sitter', () => {
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

            mockDatabaseService.getApplicationsBySitter.mockReturnValue(
                mockApplications,
            );

            // Act
            const result = service.applicationsBySitter(sitterId);

            // Assert
            expect(
                mockDatabaseService.getApplicationsBySitter,
            ).toHaveBeenCalledWith('sitter1');
            expect(result).toEqual(mockApplications);
        });
    });

    describe('applicationsByListing', () => {
        it('should return applications for a specific listing', () => {
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

            mockDatabaseService.getApplicationsByListing.mockReturnValue(
                mockApplications,
            );

            // Act
            const result = service.applicationsByListing(listingId);

            // Assert
            expect(
                mockDatabaseService.getApplicationsByListing,
            ).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockApplications);
        });
    });
});
