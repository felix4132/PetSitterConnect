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
        let needsApplicationFiltering = false;
        let listingTypeFilter: string | undefined;

        if (filters) {
            // Process filters with proper type validation
            for (const [key, value] of Object.entries(filters)) {
                if (value === undefined || value === null) {
                    continue;
                }

                switch (key) {
                    case 'listingType':
                        // Handle listingType filtering - requires post-processing
                        if (typeof value === 'string') {
                            listingTypeFilter = value;
                            needsApplicationFiltering = true;
                        }
                        break;
                    
                    case 'sitterVerified':
                        // Ensure boolean type
                        if (typeof value === 'boolean') {
                            whereConditions.sitterVerified = value;
                        } else if (typeof value === 'string') {
                            if (value === 'true') whereConditions.sitterVerified = true;
                            else if (value === 'false') whereConditions.sitterVerified = false;
                            // Invalid string values are ignored
                        }
                        break;
                    
                    case 'price':
                    case 'age':
                    case 'id':
                        // Ensure numeric type
                        if (typeof value === 'number' && !isNaN(value)) {
                            (whereConditions as any)[key] = value;
                        } else if (typeof value === 'string') {
                            const numValue = Number(value);
                            if (!isNaN(numValue)) {
                                (whereConditions as any)[key] = numValue;
                            }
                            // Invalid string values are ignored
                        }
                        break;
                    
                    case 'species':
                    case 'ownerId':
                    case 'title':
                    case 'description':
                    case 'startDate':
                    case 'endDate':
                    case 'breed':
                    case 'size':
                    case 'feeding':
                    case 'medication':
                        // String fields - direct assignment
                        if (typeof value === 'string') {
                            (whereConditions as any)[key] = value;
                        }
                        break;
                    
                    default:
                        // Unknown fields are ignored for security
                        break;
                }
            }
        }

        const listings = await this.listingRepository.find({
            where: whereConditions,
            order: { id: 'DESC' }, // Most recent first
            take: 100, // Pagination limit
        });

        // Apply post-processing filters if needed
        if (needsApplicationFiltering && listingTypeFilter) {
            return listings.filter((listing) =>
                listing.listingType.includes(listingTypeFilter as any),
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
