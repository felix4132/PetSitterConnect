import { Inject, Injectable } from '@nestjs/common';
import type { Listing } from '../../domain/listings/listing.entity.js';
import { DatabaseService } from '../../infrastructure/database/database.service.js';
import { CreateListingDto } from './dto/create-listing.dto.js';

@Injectable()
export class ListingsService {
    constructor(
        @Inject(DatabaseService) private readonly db: DatabaseService,
    ) {}

    async create(dto: CreateListingDto): Promise<Listing> {
        const listingData: Omit<Listing, 'id'> = {
            ownerId: dto.ownerId,
            title: dto.title,
            description: dto.description,
            species: dto.species,
            listingType: dto.listingType,
            startDate: dto.startDate,
            endDate: dto.endDate,
            sitterVerified: dto.sitterVerified || false,
            price: dto.price,
            breed: dto.breed,
            age: dto.age,
            size: dto.size,
            feeding: dto.feeding,
            medication: dto.medication,
        };
        return this.db.addListing(listingData);
    }

    async findAll(filters?: Partial<Listing>): Promise<Listing[]> {
        // Optimized: Direct database query instead of load-all + JS-filter
        if (filters && Object.keys(filters).length > 0) {
            return this.db.getListingsWithFilters(filters);
        }
        // Use optimized method with pagination when no filters
        return this.db.getListingsWithFilters();
    }

    async findByOwner(ownerId: string): Promise<Listing[]> {
        // Optimized: Direct WHERE query instead of load-all + filter
        return this.db.getListingsByOwner(ownerId);
    }

    async findOne(id: number): Promise<Listing | null> {
        return this.db.getListing(id);
    }

    async findOneWithApplications(id: number): Promise<Listing | null> {
        // Optimized: Load listing with applications in single query
        return this.db.getListingWithApplications(id);
    }
}
