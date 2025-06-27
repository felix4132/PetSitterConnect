import { Inject, Injectable } from '@nestjs/common';
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

    apply(dto: ApplyDto): Application | undefined {
        const listing = this.db.getListing(dto.listingId);
        if (!listing) {
            return undefined;
        }
        return this.db.addApplication({
            listingId: dto.listingId,
            sitterId: dto.sitterId,
        });
    }

    updateStatus(
        id: number,
        status: UpdateApplicationDto['status'],
    ): Application | undefined {
        return this.db.updateApplicationStatus(id, status);
    }

    applicationsBySitter(sitterId: string): Application[] {
        return this.db.getApplicationsBySitter(sitterId);
    }

    applicationsByListing(listingId: number): Application[] {
        return this.db.getApplicationsByListing(listingId);
    }
}
