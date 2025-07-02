import {
    Body,
    Controller,
    Get,
    Inject,
    NotFoundException,
    Param,
    ParseIntPipe,
    Post,
    Query,
    ValidationPipe,
} from '@nestjs/common';
import type { Listing } from '../../domain/listings/listing.entity.js';
import { CreateListingDto } from './dto/create-listing.dto.js';
import { ListingsService } from './listings.service.js';

@Controller('listings')
export class ListingsController {
    constructor(
        @Inject(ListingsService)
        private readonly listingsService: ListingsService,
    ) {}

    @Post()
    async create(
        @Body(new ValidationPipe({ transform: true })) dto: CreateListingDto,
    ): Promise<Listing> {
        return this.listingsService.create(dto);
    }

    @Get()
    async find(@Query() query: Record<string, string>): Promise<Listing[]> {
        // Parse query parameters to correct types
        const parsedQuery: Partial<Listing> = {};

        // Parse numeric fields
        if (query.id) {
            const parsed = parseInt(query.id, 10);
            if (!isNaN(parsed)) parsedQuery.id = parsed;
        }
        if (query.price) {
            const parsed = parseFloat(query.price);
            if (!isNaN(parsed)) parsedQuery.price = parsed;
        }
        if (query.age) {
            const parsed = parseInt(query.age, 10);
            if (!isNaN(parsed)) parsedQuery.age = parsed;
        }

        // Parse boolean fields
        if (query.sitterVerified) {
            parsedQuery.sitterVerified = query.sitterVerified === 'true';
        }

        // Keep string fields as they are
        if (query.ownerId) parsedQuery.ownerId = query.ownerId;
        if (query.title) parsedQuery.title = query.title;
        if (query.description) parsedQuery.description = query.description;
        if (query.species) {
            parsedQuery.species = query.species as Listing['species'];
        }
        if (query.listingType) {
            parsedQuery.listingType =
                query.listingType as Listing['listingType'];
        }
        if (query.startDate) parsedQuery.startDate = query.startDate;
        if (query.endDate) parsedQuery.endDate = query.endDate;
        if (query.breed) parsedQuery.breed = query.breed;
        if (query.size) parsedQuery.size = query.size;
        if (query.feeding) parsedQuery.feeding = query.feeding;
        if (query.medication) parsedQuery.medication = query.medication;

        return this.listingsService.findAll(parsedQuery);
    }

    @Get(':id/with-applications')
    async findOneWithApplications(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<Listing> {
        const listing = await this.listingsService.findOneWithApplications(id);
        if (!listing) {
            throw new NotFoundException(
                `Listing with ID ${id.toString()} not found`,
            );
        }
        return listing;
    }

    @Get('owner/:ownerId')
    async findByOwner(@Param('ownerId') ownerId: string): Promise<Listing[]> {
        return this.listingsService.findByOwner(ownerId);
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<Listing> {
        const listing = await this.listingsService.findOne(id);
        if (!listing) {
            throw new NotFoundException(
                `Listing with ID ${id.toString()} not found`,
            );
        }
        return listing;
    }
}
