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
            // Additional validation for empty string
            if (!dto.sitterId || dto.sitterId.trim() === '') {
                throw new BadRequestException('sitterId cannot be empty');
            }

            const listing = await this.db.getListing(dto.listingId);
            if (!listing) {
                throw new NotFoundException(
                    `Listing with ID ${dto.listingId.toString()} not found`,
                );
            }

            // Prüfe ob der Sitter bereits eine Application für dieses Listing hat
            const existingApplications = await this.db.getApplicationsByListing(
                dto.listingId,
            );
            const existingApplication = existingApplications.find(
                (app) => app.sitterId === dto.sitterId,
            );

            if (existingApplication) {
                throw new BadRequestException(
                    `Sitter ${dto.sitterId} has already applied to listing ${dto.listingId.toString()}`,
                );
            }

            const application = await this.db.addApplication({
                listingId: dto.listingId,
                sitterId: dto.sitterId,
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

            // Wenn eine Bewerbung angenommen wird, alle anderen für dasselbe Listing ablehnen
            if (status === 'accepted') {
                try {
                    const otherApplications =
                        await this.db.getApplicationsByListing(
                            application.listingId,
                        );

                    // Alle anderen Bewerbungen auf 'rejected' setzen
                    const rejectPromises = otherApplications
                        .filter(
                            (app) => app.id !== id && app.status !== 'rejected',
                        )
                        .map((app) =>
                            this.db.updateApplicationStatus(app.id, 'rejected'),
                        );

                    await Promise.all(rejectPromises);
                } catch (rejectError) {
                    // Log warning but don't fail the main operation
                    this.logger.warn(
                        'Failed to reject other applications:',
                        rejectError,
                    );
                }
            }

            return application;
        } catch (error) {
            // Re-throw known errors
            if (error instanceof NotFoundException) {
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
