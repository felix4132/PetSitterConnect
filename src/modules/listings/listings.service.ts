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
            // Note: Basic validation is handled by DTO validators
            // Add business logic validation here
            
            // Validate dates
            const today = new Date();
            const startDate = new Date(dto.startDate);
            const endDate = new Date(dto.endDate);
            
            if (startDate < today) {
                throw new BadRequestException(
                    'Start date cannot be in the past',
                );
            }
            
            if (endDate <= startDate) {
                throw new BadRequestException(
                    'End date must be after start date',
                );
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
            // Note: Filter validation is handled by query DTOs
            // Use optimized database filtering
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
