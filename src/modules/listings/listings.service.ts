import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service.js';
import type { Listing } from '../../domain/listings/listing.entity.js';

export interface CreateListingDto {
    ownerId: string;
    title: string;
    description: string;
    species: 'dog' | 'cat' | 'bird' | 'exotic';
    listingType: 'house-sitting' | 'drop-in-visit' | 'day-care';
    startDate: string;
    endDate: string;
    sitterVerified: boolean;
    price: number;
    breed: string;
    age: number;
    size: string;
    feeding: string;
    medication: string;
}

@Injectable()
export class ListingsService {
    constructor(
        @Inject(DatabaseService) private readonly db: DatabaseService,
    ) {}

    create(dto: CreateListingDto): Listing {
        return this.db.addListing(dto);
    }

    findAll(filters?: Partial<Listing>): Listing[] {
        let listings = this.db.getListings();
        if (filters) {
            listings = listings.filter((listing) => {
                return (Object.keys(filters) as (keyof Listing)[]).every(
                    (key) => {
                        const value = filters[key];
                        return value === undefined || listing[key] === value;
                    },
                );
            });
        }
        return listings;
    }

    findByOwner(ownerId: string): Listing[] {
        return this.db.getListings().filter((l) => l.ownerId === ownerId);
    }

    findOne(id: number): Listing | undefined {
        return this.db.getListing(id);
    }
}
