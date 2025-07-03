import {
    BadRequestException,
    ConflictException,
    Inject,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import type { Listing } from '../../domain/listings/listing.entity.js';
import { DatabaseService } from '../../infrastructure/database/database.service.js';
import { CreateListingDto } from './dto/create-listing.dto.js';

@Injectable()
export class ListingsService {
    private readonly logger = new Logger(ListingsService.name);

    constructor(
        @Inject(DatabaseService) private readonly db: DatabaseService,
    ) {}

    async create(dto: CreateListingDto): Promise<Listing> {
        try {
            // Basic field validation
            if (!dto.title || dto.title.trim() === '') {
                throw new BadRequestException('title should not be empty');
            }

            if (!dto.description || dto.description.trim() === '') {
                throw new BadRequestException(
                    'description should not be empty',
                );
            }

            if (!dto.ownerId || dto.ownerId.trim() === '') {
                throw new BadRequestException('ownerId should not be empty');
            }

            if (dto.price < 0) {
                throw new BadRequestException('price must not be less than 0');
            }

            // Additional validation for enum values
            const validSpecies = ['dog', 'cat', 'bird', 'exotic', 'other'];
            if (!validSpecies.includes(dto.species)) {
                throw new BadRequestException(
                    'species must be one of: dog, cat, bird, exotic, other',
                );
            }

            const validListingTypes = [
                'house-sitting',
                'drop-in-visit',
                'day-care',
                'walks',
                'feeding',
                'overnight',
            ];

            for (const type of dto.listingType) {
                if (!validListingTypes.includes(type)) {
                    throw new BadRequestException(
                        'each listingType must be one of: house-sitting, drop-in-visit, day-care, walks, feeding, overnight',
                    );
                }
            }

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
            return await this.db.addListing(listingData);
        } catch (error) {
            // Re-throw BadRequestException and other HTTP exceptions
            if (
                error instanceof BadRequestException ||
                error instanceof NotFoundException ||
                error instanceof ConflictException
            ) {
                throw error;
            }

            // Log and throw InternalServerErrorException for unexpected errors
            this.logger.error('Unexpected error creating listing', error);
            throw new InternalServerErrorException(
                'Failed to create listing. Please try again.',
            );
        }
    }

    async findAll(filters?: Partial<Listing>): Promise<Listing[]> {
        try {
            // Validate filters if provided
            if (filters) {
                if (filters.species) {
                    const validSpecies = [
                        'dog',
                        'cat',
                        'bird',
                        'exotic',
                        'other',
                    ];
                    if (!validSpecies.includes(filters.species)) {
                        throw new BadRequestException(
                            'species must be one of: dog, cat, bird, exotic, other',
                        );
                    }
                }

                if (filters.listingType) {
                    const validListingTypes = [
                        'house-sitting',
                        'drop-in-visit',
                        'day-care',
                        'walks',
                        'feeding',
                        'overnight',
                    ];

                    // Handle single string value or array
                    const listingTypes = Array.isArray(filters.listingType)
                        ? filters.listingType
                        : [filters.listingType];

                    for (const type of listingTypes) {
                        if (!validListingTypes.includes(type)) {
                            throw new BadRequestException(
                                `listingType value "${type}" is not valid. Must be one of: ${validListingTypes.join(', ')}`,
                            );
                        }
                    }
                }
            }

            // Optimized: Direct database query instead of load-all + JS-filter
            if (filters && Object.keys(filters).length > 0) {
                return await this.db.getListingsWithFilters(filters);
            }
            // Use optimized method with pagination when no filters
            return await this.db.getListingsWithFilters();
        } catch (error) {
            // Re-throw BadRequestException and other HTTP exceptions
            if (
                error instanceof BadRequestException ||
                error instanceof NotFoundException ||
                error instanceof ConflictException
            ) {
                throw error;
            }

            // Log and throw InternalServerErrorException for unexpected errors
            this.logger.error('Unexpected error retrieving listings', error);
            throw new InternalServerErrorException(
                'Failed to retrieve listings. Please try again.',
            );
        }
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
