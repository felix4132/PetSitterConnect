import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Listing } from '../../domain/listings/listing.entity.js';
import { ListingsController } from './listings.controller.js';
import { ListingsService } from './listings.service.js';

@Module({
    imports: [TypeOrmModule.forFeature([Listing])],
    controllers: [ListingsController],
    providers: [ListingsService],
    exports: [ListingsService],
})
export class ListingsModule {}
