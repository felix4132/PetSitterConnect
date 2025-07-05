import {
    BadRequestException,
    Inject,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import type { Application } from '../../domain/applications/application.entity.js';
import { DatabaseService } from '../../infrastructure/database/database.service.js';
import type { UpdateApplicationDto } from './dto/application.dto.js';

export interface ApplyDto {
    sitterId: string;
    listingId: number;
}

@Injectable()
export class ApplicationsService {
    private readonly logger = new Logger(ApplicationsService.name);

    constructor(
        @Inject(DatabaseService) private readonly db: DatabaseService,
    ) {}

    async apply(dto: ApplyDto): Promise<Application> {
        try {
            // Additional validation and sanitization for sitterId
            const sanitizedSitterId = dto.sitterId.trim();
            if (!sanitizedSitterId) {
                throw new BadRequestException('sitterId cannot be empty');
            }

            const listing = await this.db.getListing(dto.listingId);
            if (!listing) {
                throw new NotFoundException(
                    `Listing with ID ${dto.listingId.toString()} not found`,
                );
            }

            // Check if the sitter has already applied to this listing
            const existingApplications = await this.db.getApplicationsByListing(
                dto.listingId,
            );
            const existingApplication = existingApplications.find(
                (app) => app.sitterId === sanitizedSitterId,
            );

            if (existingApplication) {
                throw new BadRequestException(
                    `Sitter ${sanitizedSitterId} has already applied to listing ${dto.listingId.toString()}`,
                );
            }

            const application = await this.db.addApplication({
                listingId: dto.listingId,
                sitterId: sanitizedSitterId,
            });
            return application;
        } catch (error) {
            // Re-throw known errors
            if (
                error instanceof NotFoundException ||
                error instanceof BadRequestException
            ) {
                throw error;
            }
            // Handle unexpected errors
            throw new InternalServerErrorException(
                'Failed to create application. Please try again.',
            );
        }
    }

    async updateStatus(
        id: number,
        status: UpdateApplicationDto['status'],
    ): Promise<Application> {
        try {
            const application = await this.db.updateApplicationStatus(
                id,
                status,
            );
            if (!application) {
                throw new NotFoundException(
                    `Application with ID ${id.toString()} not found`,
                );
            }

            // Business rule validation: Check if we can still accept applications
            if (status === 'accepted') {
                // Get the listing to check dates
                const listing = await this.db.getListing(application.listingId);
                if (listing) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison
                    const startDate = new Date(listing.startDate);

                    // Check if the listing start date is in the past
                    if (startDate < today) {
                        // Revert the status change
                        await this.db.updateApplicationStatus(id, 'pending');
                        throw new BadRequestException(
                            'Cannot accept applications for listings that have already started',
                        );
                    }
                }
            }

            // Auto-reject other applications when one is accepted
            if (status === 'accepted') {
                try {
                    const otherApplications =
                        await this.db.getApplicationsByListing(
                            application.listingId,
                        );

                    // Find applications that need to be rejected
                    const applicationsToReject = otherApplications.filter(
                        (app) => app.id !== id && app.status === 'pending',
                    );

                    if (applicationsToReject.length > 0) {
                        this.logger.log(
                            `Auto-rejecting ${String(applicationsToReject.length)} other applications for listing ${String(application.listingId)}`,
                        );

                        // Reject all other pending applications
                        const rejectPromises = applicationsToReject.map((app) =>
                            this.db.updateApplicationStatus(app.id, 'rejected'),
                        );

                        await Promise.all(rejectPromises);

                        this.logger.log(
                            `Successfully auto-rejected ${String(applicationsToReject.length)} applications`,
                        );
                    }
                } catch (rejectError) {
                    // Log error but don't fail the main operation
                    this.logger.error(
                        `Failed to auto-reject other applications for listing ${String(application.listingId)}:`,
                        rejectError,
                    );
                    // Consider this a critical issue since it could lead to double-booking
                    throw new InternalServerErrorException(
                        'Application accepted but failed to reject other applications. Please verify listing status.',
                    );
                }
            }

            return application;
        } catch (error) {
            // Re-throw known errors
            if (
                error instanceof NotFoundException ||
                error instanceof BadRequestException ||
                error instanceof InternalServerErrorException
            ) {
                throw error;
            }
            // Handle unexpected errors
            throw new InternalServerErrorException(
                'Failed to update application status. Please try again.',
            );
        }
    }

    async applicationsBySitter(sitterId: string): Promise<Application[]> {
        // Optimized: Include listing relations instead of separate queries
        return this.db.getApplicationsWithListings(sitterId);
    }

    async applicationsByListing(listingId: number): Promise<Application[]> {
        return this.db.getApplicationsByListing(listingId);
    }
}
