import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from '../../domain/applications/application.entity.js';
import { Listing } from '../../domain/listings/listing.entity.js';
import { DatabaseService } from './database.service.js';

@Global()
@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'sqlite',
            database: ':memory:', // For testing, use in-memory database
            entities: [Listing, Application],
            synchronize: true,
            logging: false,
        }),
        TypeOrmModule.forFeature([Listing, Application]),
    ],
    providers: [DatabaseService],
    exports: [DatabaseService, TypeOrmModule],
})
export class DatabaseModule {}
