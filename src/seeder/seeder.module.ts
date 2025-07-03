import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from '../domain/applications/application.entity.js';
import { Listing } from '../domain/listings/listing.entity.js';
import { SeederService } from './seeder.service.js';

@Module({
    imports: [TypeOrmModule.forFeature([Listing, Application])],
    providers: [SeederService],
    exports: [SeederService],
})
export class SeederModule {}
