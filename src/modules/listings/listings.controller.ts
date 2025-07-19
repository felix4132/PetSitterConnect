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
} from '@nestjs/common';
import type { Listing } from '../../domain/listings/listing.entity.js';
import { CreateListingDto } from './dto/create-listing.dto.js';
import { FindListingsQueryDto } from './dto/find-listings-query.dto.js';
import { ListingsService } from './listings.service.js';

@Controller('listings')
export class ListingsController {
    constructor(
        @Inject(ListingsService)
        private readonly listingsService: ListingsService,
    ) {}

    @Post()
    async create(@Body() dto: CreateListingDto): Promise<Listing> {
        return this.listingsService.create(dto);
    }

    @Get()
    async find(@Query() query: FindListingsQueryDto): Promise<Listing[]> {
        return this.listingsService.findAll(query);
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
