import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from '../src/domain/applications/application.entity.js';
import { Listing } from '../src/domain/listings/listing.entity.js';
import { DatabaseService } from '../src/infrastructure/database/database.service.js';
import { SeederService } from '../src/seeder/seeder.service.js';

describe('SeederService', () => {
    let service: SeederService;
    let listingRepository: Repository<Listing>;
    let applicationRepository: Repository<Application>;
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    entities: [Listing, Application],
                    synchronize: true,
                }),
                TypeOrmModule.forFeature([Listing, Application]),
            ],
            providers: [SeederService, DatabaseService],
        }).compile();

        service = module.get<SeederService>(SeederService);
        listingRepository = module.get('ListingRepository');
        applicationRepository = module.get('ApplicationRepository');

        // Lösche alle vorhandenen Daten vor jedem Test
        await applicationRepository.clear();
        await listingRepository.clear();
    });

    afterEach(async () => {
        await module.close();
    });

    describe('onApplicationBootstrap', () => {
        it('should seed listings and applications when database is empty', async () => {
            // Verifiziere, dass die Datenbank leer ist
            const initialListingCount = await listingRepository.count();
            const initialApplicationCount = await applicationRepository.count();

            expect(initialListingCount).toBe(0);
            expect(initialApplicationCount).toBe(0);

            // Führe Seeding aus
            await service.onApplicationBootstrap();

            // Verifiziere, dass Daten erstellt wurden
            const finalListingCount = await listingRepository.count();
            const finalApplicationCount = await applicationRepository.count();

            expect(finalListingCount).toBe(5);
            expect(finalApplicationCount).toBe(5);
        });

        it('should not seed if data already exists', async () => {
            // Erstelle einen Listing-Eintrag
            const existingListing = await listingRepository.save({
                ownerId: 'existing-owner',
                title: 'Existing Listing',
                description: 'Already exists',
                species: 'dog',
                listingType: ['walks'],
                startDate: '2025-07-01',
                endDate: '2025-07-02',
                sitterVerified: false,
                price: 10.0,
            });

            // Erstelle einen Application-Eintrag
            await applicationRepository.save({
                listingId: existingListing.id,
                sitterId: 'existing-sitter',
                status: 'pending',
            });

            const initialListingCount = await listingRepository.count();
            const initialApplicationCount = await applicationRepository.count();

            expect(initialListingCount).toBe(1);
            expect(initialApplicationCount).toBe(1);

            // Führe Seeding aus
            await service.onApplicationBootstrap();

            // Verifiziere, dass keine neuen Daten erstellt wurden
            const finalListingCount = await listingRepository.count();
            const finalApplicationCount = await applicationRepository.count();

            expect(finalListingCount).toBe(1);
            expect(finalApplicationCount).toBe(1);
        });

        it('should create listings with correct data structure', async () => {
            await service.onApplicationBootstrap();

            const listings = await listingRepository.find();

            expect(listings).toHaveLength(5);

            // Überprüfe erste Listing
            const goldenRetrieverListing = listings.find(
                (l) => l.breed === 'Golden Retriever',
            );

            expect(goldenRetrieverListing).toBeDefined();
            expect(goldenRetrieverListing?.ownerId).toBe('owner-1');
            expect(goldenRetrieverListing?.title).toBe(
                'Liebevolle Betreuung für Golden Retriever',
            );
            expect(goldenRetrieverListing?.species).toBe('dog');
            expect(goldenRetrieverListing?.listingType).toEqual([
                'house-sitting',
                'walks',
            ]);
            expect(goldenRetrieverListing?.sitterVerified).toBe(true);
            expect(goldenRetrieverListing?.price).toBe(35.0);
            expect(goldenRetrieverListing?.age).toBe(3);
            expect(goldenRetrieverListing?.size).toBe('Groß');

            // Überprüfe alle Tierarten sind vertreten
            const species = listings.map((l) => l.species);
            expect(species).toContain('dog');
            expect(species).toContain('cat');
            expect(species).toContain('bird');
            expect(species).toContain('other');
        });

        it('should create applications with references to listings', async () => {
            await service.onApplicationBootstrap();

            const applications = await applicationRepository.find({
                relations: ['listing'],
            });

            expect(applications).toHaveLength(5);

            // Überprüfe, dass alle Applications gültige Listing-Referenzen haben
            applications.forEach((app) => {
                expect(app.listingId).toBeGreaterThan(0);
                expect(app.sitterId).toMatch(/^sitter-\d+$/);
                expect(['pending', 'accepted', 'rejected']).toContain(
                    app.status,
                );
            });

            // Überprüfe verschiedene Status
            const statuses = applications.map((app) => app.status);
            expect(statuses).toContain('pending');
            expect(statuses).toContain('accepted');
            expect(statuses).toContain('rejected');
        });

        it('should handle database errors gracefully', async () => {
            // Simuliere Datenbankfehler durch Mocken der Repository-Methoden
            const mockError = new Error('Database connection error');
            vi.spyOn(listingRepository, 'count').mockRejectedValue(mockError);

            // Die Methode sollte nicht fehlschlagen, sondern Fehler loggen
            await expect(
                service.onApplicationBootstrap(),
            ).resolves.not.toThrow();
        });

        it('should handle errors during seeding applications', async () => {
            // Erstelle ein Listing, damit seedApplications ausgeführt wird
            await listingRepository.save({
                ownerId: 'test-owner',
                title: 'Test Listing',
                description: 'Test',
                species: 'dog',
                listingType: ['walks'],
                startDate: '2025-07-01',
                endDate: '2025-07-02',
                sitterVerified: false,
                price: 10.0,
            });

            // Simuliere Fehler bei seedApplications
            const mockError = new Error(
                'Database error during application seeding',
            );
            vi.spyOn(applicationRepository, 'save').mockRejectedValue(
                mockError,
            );

            // Die Methode sollte nicht fehlschlagen, sondern Fehler loggen
            await expect(
                service.onApplicationBootstrap(),
            ).resolves.not.toThrow();
        });

        it('should handle errors when saving listings', async () => {
            // Simuliere Fehler beim Speichern von Listings
            const mockError = new Error('Database error during listing save');
            vi.spyOn(listingRepository, 'save').mockRejectedValue(mockError);

            // Die Methode sollte nicht fehlschlagen, sondern Fehler loggen
            await expect(
                service.onApplicationBootstrap(),
            ).resolves.not.toThrow();
        });
    });

    describe('data validation', () => {
        it('should create listings with valid date formats', async () => {
            await service.onApplicationBootstrap();

            const listings = await listingRepository.find();

            listings.forEach((listing) => {
                // Überprüfe ISO-Datumsformat
                expect(listing.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
                expect(listing.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

                // Überprüfe, dass startDate vor endDate liegt
                expect(new Date(listing.startDate).getTime()).toBeLessThan(
                    new Date(listing.endDate).getTime(),
                );
            });
        });

        it('should create listings with valid enum values', async () => {
            await service.onApplicationBootstrap();

            const listings = await listingRepository.find();
            const validSpecies = ['dog', 'cat', 'bird', 'exotic', 'other'];
            const validListingTypes = [
                'house-sitting',
                'drop-in-visit',
                'day-care',
                'walks',
                'feeding',
                'overnight',
            ];

            listings.forEach((listing) => {
                expect(validSpecies).toContain(listing.species);

                listing.listingType.forEach((type) => {
                    expect(validListingTypes).toContain(type);
                });
            });
        });

        it('should create applications with valid status values according to business logic', async () => {
            await service.onApplicationBootstrap();

            const applications = await applicationRepository.find();
            const validStatuses = ['pending', 'accepted', 'rejected'];

            applications.forEach((application) => {
                expect(validStatuses).toContain(application.status);
            });

            // Teste Business Logic: Für ein Listing sollte maximal eine Application 'accepted' sein
            const groupedByListing = applications.reduce<Record<number, any[]>>(
                (acc, app) => {
                    const existingApps = acc[app.listingId] ?? [];
                    acc[app.listingId] = [...existingApps, app];
                    return acc;
                },
                {},
            );

            Object.values(groupedByListing).forEach((listingApps) => {
                const acceptedCount = listingApps.filter(
                    (app) => app.status === 'accepted',
                ).length;
                expect(acceptedCount).toBeLessThanOrEqual(1);

                // Wenn eine accepted ist, sollten alle anderen rejected oder pending sein
                if (acceptedCount === 1) {
                    const nonAccepted = listingApps.filter(
                        (app) => app.status !== 'accepted',
                    );
                    nonAccepted.forEach((app) => {
                        expect(['rejected', 'pending']).toContain(app.status);
                    });
                }
            });
        });
    });

    describe('idempotency', () => {
        it('should be idempotent when called multiple times', async () => {
            // Erstes Seeding
            await service.onApplicationBootstrap();

            const firstListingCount = await listingRepository.count();
            const firstApplicationCount = await applicationRepository.count();

            // Zweites Seeding
            await service.onApplicationBootstrap();

            const secondListingCount = await listingRepository.count();
            const secondApplicationCount = await applicationRepository.count();

            // Die Zahlen sollten gleich bleiben
            expect(secondListingCount).toBe(firstListingCount);
            expect(secondApplicationCount).toBe(firstApplicationCount);
        });
    });
});
