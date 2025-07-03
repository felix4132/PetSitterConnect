import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type FindOptionsWhere } from 'typeorm';
import { Application } from '../../domain/applications/application.entity.js';
import { Listing } from '../../domain/listings/listing.entity.js';

@Injectable()
export class DatabaseService {
    constructor(
        @InjectRepository(Listing)
        private readonly listingRepository: Repository<Listing>,
        @InjectRepository(Application)
        private readonly applicationRepository: Repository<Application>,
    ) {}

    // Optimized: Direct repository queries with database-level filtering
    async getListingsWithFilters(
        filters?: Partial<Listing>,
    ): Promise<Listing[]> {
        const whereConditions: FindOptionsWhere<Listing> = {};

        if (filters) {
            // Ensure correct types for boolean and number fields
            const typeCorrected: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(filters)) {
                if (key === 'listingType') {
                    // Handle listingType filtering - since it's now an array, we need to find listings that contain the specified type
                    if (typeof value === 'string') {
                        // For filtering, we need to check if the array contains the specified value
                        // We'll use a different approach for this - query all and filter in application
                        // This is because TypeORM simple-array doesn't support IN/CONTAINS operations easily
                        continue; // Skip adding to whereConditions
                    }
                } else if (key === 'sitterVerified') {
                    // Accept only boolean
                    if (typeof value !== 'boolean') {
                        if (value === 'true') typeCorrected[key] = true;
                        else if (value === 'false') typeCorrected[key] = false;
                        else continue;
                    } else {
                        typeCorrected[key] = value;
                    }
                } else if (['price', 'age', 'id'].includes(key)) {
                    // Accept only numbers
                    if (typeof value !== 'number') {
                        const num = Number(value);
                        if (!isNaN(num)) typeCorrected[key] = num;
                    } else {
                        typeCorrected[key] = value;
                    }
                } else {
                    typeCorrected[key] = value;
                }
            }
            Object.assign(whereConditions, typeCorrected);
        }

        const listings = await this.listingRepository.find({
            where: whereConditions,
            order: { id: 'DESC' }, // Most recent first
            take: 100, // Pagination limit
        });

        // If listingType filter was specified, filter in application layer
        if (filters?.listingType && typeof filters.listingType === 'string') {
            const filterType = filters.listingType as
                | 'house-sitting'
                | 'drop-in-visit'
                | 'day-care'
                | 'walks'
                | 'feeding'
                | 'overnight';
            return listings.filter((listing) =>
                listing.listingType.includes(filterType),
            );
        }

        return listings;
    }

    // Optimized: Direct database query instead of load-all + filter
    async getListingsByOwner(ownerId: string): Promise<Listing[]> {
        return this.listingRepository.find({
            where: { ownerId },
            order: { id: 'DESC' },
        });
    }

    // Optimized: With relations for better performance
    async getListingWithApplications(id: number): Promise<Listing | null> {
        return this.listingRepository.findOne({
            where: { id },
            relations: ['applications'], // Eager load applications
        });
    }

    // Optimized: Bulk operations with relations
    async getApplicationsWithListings(
        sitterId: string,
    ): Promise<Application[]> {
        return this.applicationRepository.find({
            where: { sitterId },
            relations: ['listing'], // Include listing data
            order: { id: 'DESC' },
        });
    }

    async addListing(listing: Omit<Listing, 'id'>): Promise<Listing> {
        const newListing = this.listingRepository.create(listing);
        return this.listingRepository.save(newListing);
    }

    async getListing(id: number): Promise<Listing | null> {
        return this.listingRepository.findOneBy({ id });
    }

    // LEGACY: Basic method without optimizations - use getListingsWithFilters() instead
    async getListings(): Promise<Listing[]> {
        return this.listingRepository.find({
            take: 100,
            order: { id: 'DESC' },
        });
    }

    async addApplication(
        app: Omit<Application, 'id' | 'status'>,
    ): Promise<Application> {
        const newApp = this.applicationRepository.create({
            ...app,
            status: 'pending',
        });
        return this.applicationRepository.save(newApp);
    }

    async getApplication(id: number): Promise<Application | null> {
        return this.applicationRepository.findOneBy({ id });
    }

    async updateApplicationStatus(
        id: number,
        status: Application['status'],
    ): Promise<Application | null> {
        const application = await this.getApplication(id);
        if (application) {
            application.status = status;
            return this.applicationRepository.save(application);
        }
        return null;
    }

    async getApplicationsBySitter(sitterId: string): Promise<Application[]> {
        return this.applicationRepository.findBy({ sitterId });
    }

    async getApplicationsByListing(listingId: number): Promise<Application[]> {
        return this.applicationRepository.findBy({ listingId });
    }
}
