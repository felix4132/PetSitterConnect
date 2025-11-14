import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from '../../domain/applications/application.entity.js';
import { Listing } from '../../domain/listings/listing.entity.js';
import { DatabaseService } from './database.service.js';

@Global()
@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'better-sqlite3',
            database: ':memory:', // For testing, use in-memory database
            entities: [Listing, Application],
            synchronize: true,
            logging: false,
            // Better-sqlite3 specific optimizations
            prepareDatabase: (db: { pragma: (sql: string) => void }) => {
                // Enable WAL mode for better concurrency
                db.pragma('journal_mode = WAL');
                // Optimize for in-memory performance
                db.pragma('synchronous = NORMAL');
                db.pragma('cache_size = 10000');
                db.pragma('temp_store = MEMORY');
            },
        }),
        TypeOrmModule.forFeature([Listing, Application]),
    ],
    providers: [DatabaseService],
    exports: [DatabaseService, TypeOrmModule],
})
export class DatabaseModule {}
