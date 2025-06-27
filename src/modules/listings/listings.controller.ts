import {
    Body,
    Controller,
    Get,
    Inject,
    Param,
    Post,
    Query,
} from '@nestjs/common';
import { ListingsService } from './listings.service.js';
import type { CreateListingDto } from './listings.service.js';
import type { Listing } from '../../domain/listings/listing.entity.js';

@Controller('listings')
export class ListingsController {
    constructor(
        @Inject(ListingsService)
        private readonly listingsService: ListingsService,
    ) {}

    @Post()
    create(@Body() dto: CreateListingDto): Listing {
        return this.listingsService.create(dto);
    }

    @Get()
    find(@Query() query: Partial<Listing>): Listing[] {
        return this.listingsService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string): Listing | undefined {
        return this.listingsService.findOne(parseInt(id, 10));
    }

    @Get('/owner/:ownerId')
    findByOwner(@Param('ownerId') ownerId: string): Listing[] {
        return this.listingsService.findByOwner(ownerId);
    }
}
