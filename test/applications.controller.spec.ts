import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Application } from '../src/domain/applications/application.entity.ts';
import { ApplicationsController } from '../src/modules/applications/applications.controller.ts';
import { ApplicationsService } from '../src/modules/applications/applications.service.ts';
import {
    CreateApplicationDto,
    UpdateApplicationDto,
} from '../src/modules/applications/dto/application.dto.ts';

describe('ApplicationsController', () => {
    let controller: ApplicationsController;
    let mockApplicationsService: {
        apply: ReturnType<typeof vi.fn>;
        updateStatus: ReturnType<typeof vi.fn>;
        applicationsBySitter: ReturnType<typeof vi.fn>;
        applicationsByListing: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
        // Mock des ApplicationsService
        mockApplicationsService = {
            apply: vi.fn(),
            updateStatus: vi.fn(),
            applicationsBySitter: vi.fn(),
            applicationsByListing: vi.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [ApplicationsController],
            providers: [
                {
                    provide: ApplicationsService,
                    useValue: mockApplicationsService,
                },
            ],
        }).compile();

        controller = module.get<ApplicationsController>(ApplicationsController);
    });

    describe('apply', () => {
        it('should create a new application', async () => {
            // Arrange
            const listingId = 1;
            const createDto: CreateApplicationDto = {
                sitterId: 'sitter1',
            };
            const expectedApplication: Application = {
                id: 1,
                listingId: 1,
                sitterId: 'sitter1',
                status: 'pending',
            };
            mockApplicationsService.apply.mockResolvedValue(
                expectedApplication,
            );

            // Act
            const result = await controller.apply(listingId, createDto);

            // Assert
            expect(mockApplicationsService.apply).toHaveBeenCalledWith({
                listingId: 1,
                sitterId: 'sitter1',
            });
            expect(result).toEqual(expectedApplication);
        });

        it('should propagate NotFoundException when listing not found', async () => {
            // Arrange
            const listingId = 999;
            const createDto: CreateApplicationDto = {
                sitterId: 'sitter1',
            };
            const notFoundError = new Error('Listing with ID 999 not found');
            mockApplicationsService.apply.mockRejectedValue(notFoundError);

            // Act & Assert
            await expect(
                controller.apply(listingId, createDto),
            ).rejects.toThrow('Listing with ID 999 not found');
            expect(mockApplicationsService.apply).toHaveBeenCalledWith({
                listingId: 999,
                sitterId: 'sitter1',
            });
        });
    });

    describe('updateStatus', () => {
        it('should update application status', async () => {
            // Arrange
            const applicationId = 1;
            const updateDto: UpdateApplicationDto = {
                status: 'accepted',
            };
            const expectedApplication: Application = {
                id: 1,
                listingId: 1,
                sitterId: 'sitter1',
                status: 'accepted',
            };
            mockApplicationsService.updateStatus.mockResolvedValue(
                expectedApplication,
            );

            // Act
            const result = await controller.updateStatus(
                applicationId,
                updateDto,
            );

            // Assert
            expect(mockApplicationsService.updateStatus).toHaveBeenCalledWith(
                1,
                'accepted',
            );
            expect(result).toEqual(expectedApplication);
        });

        it('should propagate NotFoundException when application not found', async () => {
            // Arrange
            const applicationId = 999;
            const updateDto: UpdateApplicationDto = {
                status: 'accepted',
            };
            const notFoundError = new Error(
                'Application with ID 999 not found',
            );
            mockApplicationsService.updateStatus.mockRejectedValue(
                notFoundError,
            );

            // Act & Assert
            await expect(
                controller.updateStatus(applicationId, updateDto),
            ).rejects.toThrow('Application with ID 999 not found');
            expect(mockApplicationsService.updateStatus).toHaveBeenCalledWith(
                999,
                'accepted',
            );
        });
    });

    describe('bySitter', () => {
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
            mockApplicationsService.applicationsBySitter.mockResolvedValue(
                mockApplications,
            );

            // Act
            const result = await controller.bySitter(sitterId);

            // Assert
            expect(
                mockApplicationsService.applicationsBySitter,
            ).toHaveBeenCalledWith(sitterId);
            expect(result).toEqual(mockApplications);
        });
    });

    describe('byListing', () => {
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
            mockApplicationsService.applicationsByListing.mockResolvedValue(
                mockApplications,
            );

            // Act
            const result = await controller.byListing(listingId);

            // Assert
            expect(
                mockApplicationsService.applicationsByListing,
            ).toHaveBeenCalledWith(listingId);
            expect(result).toEqual(mockApplications);
        });
    });
});
