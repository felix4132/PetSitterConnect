import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Application } from '../../domain/applications/application.entity.js';
import { DatabaseService } from '../../infrastructure/database/database.service.js';

export interface ApplyDto {
    sitterId: string;
    listingId: number;
}

export interface UpdateApplicationDto {
    status: 'pending' | 'accepted' | 'rejected';
}

@Injectable()
export class ApplicationsService {
    constructor(
        @Inject(DatabaseService) private readonly db: DatabaseService,
    ) {}

    async apply(dto: ApplyDto): Promise<Application> {
        const listing = await this.db.getListing(dto.listingId);
        if (!listing) {
            throw new NotFoundException(
                `Listing with ID ${dto.listingId.toString()} not found`,
            );
        }
        const application = await this.db.addApplication({
            listingId: dto.listingId,
            sitterId: dto.sitterId,
        });
        return application;
    }

    async updateStatus(
        id: number,
        status: UpdateApplicationDto['status'],
    ): Promise<Application> {
        const application = await this.db.updateApplicationStatus(id, status);
        if (!application) {
            throw new NotFoundException(
                `Application with ID ${id.toString()} not found`,
            );
        }

        // Wenn eine Bewerbung angenommen wird, alle anderen für dasselbe Listing ablehnen
        if (status === 'accepted') {
            const otherApplications = await this.db.getApplicationsByListing(
                application.listingId,
            );

            // Alle anderen Bewerbungen auf 'rejected' setzen
            const rejectPromises = otherApplications
                .filter((app) => app.id !== id && app.status !== 'rejected')
                .map((app) =>
                    this.db.updateApplicationStatus(app.id, 'rejected'),
                );

            await Promise.all(rejectPromises);
        }

        return application;
    }

    async applicationsBySitter(sitterId: string): Promise<Application[]> {
        // Optimized: Include listing relations instead of separate queries
        return this.db.getApplicationsWithListings(sitterId);
    }

    async applicationsByListing(listingId: number): Promise<Application[]> {
        return this.db.getApplicationsByListing(listingId);
    }
}
