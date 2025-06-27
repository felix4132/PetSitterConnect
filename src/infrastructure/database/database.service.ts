import { Injectable } from '@nestjs/common';
import type { Application } from '../../domain/applications/application.entity.js';
import type { Listing } from '../../domain/listings/listing.entity.js';

@Injectable()
export class DatabaseService {
    private listings: Listing[] = [];
    private applications: Application[] = [];
    private listingIdCounter = 1;
    private applicationIdCounter = 1;

    addListing(listing: Omit<Listing, 'id'>): Listing {
        const newListing: Listing = { id: this.listingIdCounter++, ...listing };
        this.listings.push(newListing);
        return newListing;
    }

    getListing(id: number): Listing | undefined {
        return this.listings.find((l) => l.id === id);
    }

    getListings(): Listing[] {
        return this.listings;
    }

    addApplication(app: Omit<Application, 'id' | 'status'>): Application {
        const newApp: Application = {
            id: this.applicationIdCounter++,
            status: 'pending',
            ...app,
        };
        this.applications.push(newApp);
        return newApp;
    }

    getApplication(id: number): Application | undefined {
        return this.applications.find((a) => a.id === id);
    }

    updateApplicationStatus(
        id: number,
        status: Application['status'],
    ): Application | undefined {
        const application = this.getApplication(id);
        if (application) {
            application.status = status;
        }
        return application;
    }

    getApplicationsBySitter(sitterId: string): Application[] {
        return this.applications.filter((a) => a.sitterId === sitterId);
    }

    getApplicationsByListing(listingId: number): Application[] {
        return this.applications.filter((a) => a.listingId === listingId);
    }
}
