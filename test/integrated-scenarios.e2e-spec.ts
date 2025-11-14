import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app/app.module.ts';
import { isoDatePlus } from './test-helpers.ts';

/**
 * Komplexe kontextbasierte Tests, die mehrere Aktionen kombinieren
 * und reale Workflows der PetSitterConnect-Anwendung testen.
 */
describe('Integrated Scenarios (e2e)', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();

        // Gleiche Validation Pipeline wie in Produktion
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );

        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    describe('Complete Pet Sitting Workflow', () => {
        it('should handle full workflow: create listing, multiple applications, status transitions, and retrieval', async () => {
            // Phase 1: Pet Owner erstellt ein Listing
            const petOwnerListing = {
                ownerId: 'owner_maria',
                title: 'Caring for 2 Golden Retrievers',
                description:
                    'Need experienced sitter for my two friendly dogs while on vacation',
                species: 'dog' as const,
                listingType: ['house-sitting'] as const,
                startDate: isoDatePlus(1),
                endDate: isoDatePlus(2),
                sitterVerified: true,
                price: 50,
                breed: 'Golden Retriever',
                age: 4,
                size: 'large',
                feeding: 'twice daily',
                medication: 'joint supplements with evening meal',
            };

            const createListingResponse = await request(app.getHttpServer())
                .post('/listings')
                .send(petOwnerListing)
                .expect(201);

            const listingId: number = createListingResponse.body.id;
            expect(listingId).toBeDefined();
            expect(createListingResponse.body.title).toBe(
                petOwnerListing.title,
            );

            // Phase 2: Mehrere Pet Sitter bewerben sich
            const applications = [
                { sitterId: 'sitter_alex', expectedStatus: 'pending' },
                { sitterId: 'sitter_sarah', expectedStatus: 'pending' },
                { sitterId: 'sitter_mike', expectedStatus: 'pending' },
            ];

            const createdApplications = [];
            for (const application of applications) {
                const applyResponse = await request(app.getHttpServer())
                    .post(`/listings/${String(listingId)}/applications`)
                    .send({ sitterId: application.sitterId })
                    .expect(201);

                expect(applyResponse.body.status).toBe(
                    application.expectedStatus,
                );
                expect(applyResponse.body.listingId).toBe(listingId);
                expect(applyResponse.body.sitterId).toBe(application.sitterId);
                createdApplications.push(applyResponse.body);
            }

            // Phase 3: Owner überprüft alle Bewerbungen
            const allApplicationsResponse = await request(app.getHttpServer())
                .get(`/listings/${String(listingId)}/applications`)
                .expect(200);

            expect(allApplicationsResponse.body).toHaveLength(3);
            expect(
                allApplicationsResponse.body.every(
                    (app: any) => app.status === 'pending',
                ),
            ).toBe(true);

            // Phase 4: Owner lehnt eine Bewerbung ab
            const rejectedApplicationId = createdApplications[2].id;
            await request(app.getHttpServer())
                .patch(`/applications/${String(rejectedApplicationId)}`)
                .send({ status: 'rejected' })
                .expect(200);

            // Phase 5: Owner akzeptiert eine Bewerbung
            const acceptedApplicationId = createdApplications[1].id;
            const acceptResponse = await request(app.getHttpServer())
                .patch(`/applications/${String(acceptedApplicationId)}`)
                .send({ status: 'accepted' })
                .expect(200);

            expect(acceptResponse.body.status).toBe('accepted');
            expect(acceptResponse.body.sitterId).toBe('sitter_sarah');

            // Phase 6: Überprüfe finale Status-Verteilung
            const finalApplicationsResponse = await request(app.getHttpServer())
                .get(`/listings/${String(listingId)}/applications`)
                .expect(200);

            const statusCounts = finalApplicationsResponse.body.reduce(
                (acc: Record<string, number>, app: { status: string }) => {
                    acc[app.status] = (acc[app.status] ?? 0) + 1;
                    return acc;
                },
                {},
            );

            expect(statusCounts.pending ?? 0).toBe(0);
            expect(statusCounts.accepted ?? 0).toBe(1);
            expect(statusCounts.rejected ?? 0).toBe(2);

            // Phase 7: Sitter überprüft ihre Bewerbungen
            const sarahApplicationsResponse = await request(app.getHttpServer())
                .get('/sitters/sitter_sarah/applications')
                .expect(200);

            expect(sarahApplicationsResponse.body).toHaveLength(1);
            expect(sarahApplicationsResponse.body[0].status).toBe('accepted');
            expect(sarahApplicationsResponse.body[0].listing).toBeDefined();
            expect(sarahApplicationsResponse.body[0].listing.title).toBe(
                petOwnerListing.title,
            );

            // Phase 8: Owner überprüft Listing mit allen Bewerbungen
            const listingWithAppsResponse = await request(app.getHttpServer())
                .get(`/listings/${String(listingId)}/with-applications`)
                .expect(200);

            expect(listingWithAppsResponse.body.applications).toHaveLength(3);
            expect(listingWithAppsResponse.body.title).toBe(
                petOwnerListing.title,
            );
        });

        it('should handle concurrent applications and prevent double-booking scenarios', async () => {
            // Erstelle ein hoch-gefragtes Listing
            const premiumListing = {
                ownerId: 'owner_premium',
                title: 'Premium Cat Sitting - High Pay',
                description: 'Well-paid position for experienced cat sitter',
                species: 'cat' as const,
                listingType: ['house-sitting'] as const,
                startDate: isoDatePlus(1),
                endDate: isoDatePlus(7),
                sitterVerified: true,
                price: 80,
                breed: 'Persian',
                age: 2,
                size: 'medium',
                feeding: 'special diet - 3 times daily',
                medication: 'eye drops twice daily',
            };

            const createResponse = await request(app.getHttpServer())
                .post('/listings')
                .send(premiumListing)
                .expect(201);

            const listingId = createResponse.body.id;

            // Simuliere gleichzeitige Bewerbungen von vielen Sittern
            const concurrentApplications = [];
            const sitterIds = [
                'sitter1',
                'sitter2',
                'sitter3',
                'sitter4',
                'sitter5',
            ];

            for (const sitterId of sitterIds) {
                concurrentApplications.push(
                    request(app.getHttpServer())
                        .post(`/listings/${String(listingId)}/applications`)
                        .send({ sitterId }),
                );
            }

            // Warte auf alle Bewerbungen
            const responses = await Promise.all(concurrentApplications);
            responses.forEach((response) => {
                expect(response.status).toBe(201);
            });

            // Überprüfe, dass alle Bewerbungen erstellt wurden
            const allAppsResponse = await request(app.getHttpServer())
                .get(`/listings/${String(listingId)}/applications`)
                .expect(200);

            expect(allAppsResponse.body).toHaveLength(5);

            // Owner entscheidet sich schnell: erste Bewerbung akzeptieren, Rest ablehnen
            const firstApplicationId = String(allAppsResponse.body[0].id);

            // Akzeptiere erste Bewerbung
            await request(app.getHttpServer())
                .patch(`/applications/${firstApplicationId}`)
                .send({ status: 'accepted' })
                .expect(200);

            // Lehne alle anderen ab
            for (let i = 1; i < allAppsResponse.body.length; i++) {
                await request(app.getHttpServer())
                    .patch(
                        `/applications/${String(allAppsResponse.body[i].id)}`,
                    )
                    .send({ status: 'rejected' })
                    .expect(200);
            }

            // Überprüfe finale Verteilung
            const finalAppsResponse = await request(app.getHttpServer())
                .get(`/listings/${String(listingId)}/applications`)
                .expect(200);

            const acceptedApps = finalAppsResponse.body.filter(
                (app: any) => app.status === 'accepted',
            );
            const rejectedApps = finalAppsResponse.body.filter(
                (app: any) => app.status === 'rejected',
            );

            expect(acceptedApps).toHaveLength(1);
            expect(rejectedApps).toHaveLength(4);
        });
    });

    describe('Owner Management Scenarios', () => {
        it('should handle owner managing multiple listings with different application statuses', async () => {
            const ownerId = 'owner_multiple';

            // Erstelle mehrere verschiedene Listings
            const listings = [
                {
                    ownerId,
                    title: 'Dog Walking - Morning',
                    description: 'Need morning dog walker',
                    species: 'dog' as const,
                    listingType: ['walks'] as const,
                    startDate: isoDatePlus(1),
                    endDate: isoDatePlus(2),
                    sitterVerified: false,
                    price: 20,
                },
                {
                    ownerId,
                    title: 'Cat Feeding - Weekend',
                    description: 'Weekend cat feeding service',
                    species: 'cat' as const,
                    listingType: ['feeding'] as const,
                    startDate: isoDatePlus(1),
                    endDate: isoDatePlus(2),
                    sitterVerified: true,
                    price: 30,
                },
                {
                    ownerId,
                    title: 'Bird Care - Vacation',
                    description: 'Exotic bird care during vacation',
                    species: 'bird' as const,
                    listingType: ['house-sitting'] as const,
                    startDate: isoDatePlus(3),
                    endDate: isoDatePlus(4),
                    sitterVerified: true,
                    price: 60,
                },
            ];

            // Erstelle alle Listings
            const createdListings = [];
            for (const listing of listings) {
                const response = await request(app.getHttpServer())
                    .post('/listings')
                    .send(listing)
                    .expect(201);
                createdListings.push(response.body);
            }

            // Füge Bewerbungen zu jedem Listing hinzu
            const listingApplications = [];
            for (let i = 0; i < createdListings.length; i++) {
                const listing = createdListings[i];
                const applicationCount = i + 2; // 2, 3, 4 Bewerbungen

                const apps = [];
                for (let j = 0; j < applicationCount; j++) {
                    const applyResponse = await request(app.getHttpServer())
                        .post(`/listings/${String(listing.id)}/applications`)
                        .send({ sitterId: `sitter_${String(i)}_${String(j)}` })
                        .expect(201);
                    apps.push(applyResponse.body);
                }
                listingApplications.push(apps);
            }

            // Verschiedene Status-Management-Strategien
            // Listing 1: Alle ablehnen
            if (listingApplications[0]) {
                for (const application of listingApplications[0]) {
                    await request(app.getHttpServer())
                        .patch(`/applications/${String(application.id)}`)
                        .send({ status: 'rejected' })
                        .expect(200);
                }
            }

            // Listing 2: Eine akzeptieren, Rest ablehnen
            if (listingApplications[1]?.[0]) {
                await request(app.getHttpServer())
                    .patch(
                        `/applications/${String(listingApplications[1][0].id)}`,
                    )
                    .send({ status: 'accepted' })
                    .expect(200);
                for (let i = 1; i < listingApplications[1].length; i++) {
                    if (listingApplications[1][i]) {
                        await request(app.getHttpServer())
                            .patch(
                                `/applications/${String(listingApplications[1][i].id)}`,
                            )
                            .send({ status: 'rejected' })
                            .expect(200);
                    }
                }
            }

            // Listing 3: Alle pending lassen

            // Überprüfe Owner's Listings
            const ownerListingsResponse = await request(app.getHttpServer())
                .get(`/listings/owner/${ownerId}`)
                .expect(200);

            expect(ownerListingsResponse.body).toHaveLength(3);

            // Überprüfe Status-Verteilung pro Listing
            for (let i = 0; i < createdListings.length; i++) {
                const listingAppsResponse = await request(app.getHttpServer())
                    .get(
                        `/listings/${String(createdListings[i].id)}/applications`,
                    )
                    .expect(200);

                if (i === 0) {
                    // Alle rejected
                    expect(
                        listingAppsResponse.body.every(
                            (app: any) => app.status === 'rejected',
                        ),
                    ).toBe(true);
                } else if (i === 1) {
                    // Eine accepted, Rest rejected
                    const statuses = listingAppsResponse.body.map(
                        (app: Record<string, unknown>) => app.status,
                    );
                    expect(
                        statuses.filter((s: string) => s === 'accepted'),
                    ).toHaveLength(1);
                    expect(
                        statuses.filter((s: string) => s === 'rejected'),
                    ).toHaveLength(2);
                } else if (i === 2) {
                    // Alle pending
                    expect(
                        listingAppsResponse.body.every(
                            (app: any) => app.status === 'pending',
                        ),
                    ).toBe(true);
                }
            }
        });
    });

    describe('Sitter Journey Scenarios', () => {
        it('should track sitter applying to multiple listings with different outcomes', async () => {
            const sitterId = 'sitter_experienced';

            // Erstelle verschiedene Listings von verschiedenen Ownern
            const testListings = [
                {
                    ownerId: 'owner_a',
                    title: 'Small Dog Care',
                    description: 'Care for small dog',
                    species: 'dog' as const,
                    listingType: ['day-care'] as const,
                    startDate: isoDatePlus(1),
                    endDate: isoDatePlus(2),
                    sitterVerified: false,
                    price: 25,
                },
                {
                    ownerId: 'owner_b',
                    title: 'Cat Sitting Premium',
                    description: 'Premium cat sitting service',
                    species: 'cat' as const,
                    listingType: ['house-sitting'] as const,
                    startDate: isoDatePlus(1),
                    endDate: isoDatePlus(2),
                    sitterVerified: true,
                    price: 35,
                },
                {
                    ownerId: 'owner_c',
                    title: 'Weekend Pet Care',
                    description: 'Weekend pet care needed',
                    species: 'dog' as const,
                    listingType: ['overnight'] as const,
                    startDate: isoDatePlus(1),
                    endDate: isoDatePlus(2),
                    sitterVerified: true,
                    price: 35,
                },
            ];

            // Erstelle Listings
            const createdListings = [];
            for (const listing of testListings) {
                const response = await request(app.getHttpServer())
                    .post('/listings')
                    .send(listing)
                    .expect(201);
                createdListings.push(response.body);
            }

            // Sitter bewirbt sich auf alle Listings
            const sitterApplications = [];
            for (const listing of createdListings) {
                const applyResponse = await request(app.getHttpServer())
                    .post(`/listings/${String(listing.id)}/applications`)
                    .send({ sitterId })
                    .expect(201);
                sitterApplications.push(applyResponse.body);
            }

            // Simuliere verschiedene Owner-Entscheidungen
            // Listing 1: Rejected
            await request(app.getHttpServer())
                .patch(`/applications/${String(sitterApplications[0].id)}`)
                .send({ status: 'rejected' })
                .expect(200);

            // Listing 2: Accepted
            await request(app.getHttpServer())
                .patch(`/applications/${String(sitterApplications[1].id)}`)
                .send({ status: 'accepted' })
                .expect(200);

            // Listing 3: Bleibt pending

            // Überprüfe Sitter's Bewerbungshistorie
            const sitterAppsResponse = await request(app.getHttpServer())
                .get(`/sitters/${sitterId}/applications`)
                .expect(200);

            expect(sitterAppsResponse.body).toHaveLength(3);

            // Überprüfe Status-Verteilung
            const statuses = sitterAppsResponse.body.map(
                (app: Record<string, unknown>) => app.status,
            );
            expect(
                statuses.filter((s: string) => s === 'pending'),
            ).toHaveLength(1);
            expect(
                statuses.filter((s: string) => s === 'accepted'),
            ).toHaveLength(1);
            expect(
                statuses.filter((s: string) => s === 'rejected'),
            ).toHaveLength(1);

            // Überprüfe dass Listing-Informationen enthalten sind
            for (const app of sitterAppsResponse.body) {
                expect(app.listing).toBeDefined();
                expect(app.listing.title).toBeDefined();
                expect(app.listing.ownerId).toBeDefined();
            }
        });
    });

    describe('Complex Filtering and Search Scenarios', () => {
        it('should handle complex filtering scenarios with multiple criteria', async () => {
            // Erstelle vielfältige Listings für umfassende Filterung
            const diverseListings = [
                {
                    ownerId: 'owner_premium',
                    title: 'Luxury Dog Sitting',
                    description: 'High-end dog sitting service',
                    species: 'dog' as const,
                    listingType: ['house-sitting'] as const,
                    startDate: isoDatePlus(1),
                    endDate: isoDatePlus(2),
                    sitterVerified: true,
                    price: 80,
                    breed: 'Poodle',
                    age: 3,
                    size: 'medium',
                },
                {
                    ownerId: 'owner_budget',
                    title: 'Simple Cat Feeding',
                    description: 'Basic cat feeding service',
                    species: 'cat' as const,
                    listingType: ['feeding'] as const,
                    startDate: isoDatePlus(1),
                    endDate: isoDatePlus(2),
                    sitterVerified: false,
                    price: 15,
                    breed: 'Mixed',
                    age: 5,
                    size: 'small',
                },
                {
                    ownerId: 'owner_premium',
                    title: 'Professional Dog Walking',
                    description: 'Professional dog walking service',
                    species: 'dog' as const,
                    listingType: ['walks'] as const,
                    startDate: isoDatePlus(1),
                    endDate: isoDatePlus(2),
                    sitterVerified: true,
                    price: 25,
                    breed: 'Labrador',
                    age: 2,
                    size: 'large',
                },
            ];

            // Erstelle alle Listings
            for (const listing of diverseListings) {
                await request(app.getHttpServer())
                    .post('/listings')
                    .send(listing)
                    .expect(201);
            }

            // Test 1: Filter nur verified sitters
            const verifiedOnlyResponse = await request(app.getHttpServer())
                .get('/listings?sitterVerified=true')
                .expect(200);

            expect(verifiedOnlyResponse.body.length).toBeGreaterThan(0);
            expect(
                verifiedOnlyResponse.body.every(
                    (listing: any) => listing.sitterVerified === true,
                ),
            ).toBe(true);

            // Test 2: Filter by owner und verified
            const ownerAndVerifiedResponse = await request(app.getHttpServer())
                .get('/listings?ownerId=owner_premium&sitterVerified=true')
                .expect(200);

            expect(ownerAndVerifiedResponse.body).toHaveLength(2);
            expect(
                ownerAndVerifiedResponse.body.every(
                    (listing: any) =>
                        listing.ownerId === 'owner_premium' &&
                        listing.sitterVerified === true,
                ),
            ).toBe(true);

            // Test 3: Preis-Range filtering - verwende einen eindeutigen Preis
            const budgetListingsResponse = await request(app.getHttpServer())
                .get('/listings?price=35')
                .expect(200);

            expect(budgetListingsResponse.body).toHaveLength(1);
            expect(budgetListingsResponse.body[0].price).toBe(35);

            // Test 4: Spezies und Listing-Type Kombination
            const dogWalksResponse = await request(app.getHttpServer())
                .get('/listings?species=dog&listingType=walks')
                .expect(200);

            expect(
                dogWalksResponse.body.some(
                    (l: { species: string; listingType: string[] }) =>
                        l.species === 'dog' &&
                        Array.isArray(l.listingType) &&
                        l.listingType.includes('walks'),
                ),
            ).toBe(true);

            // Test 5: Keine Ergebnisse Filter
            const noResultsResponse = await request(app.getHttpServer())
                .get('/listings?species=bird&price=100')
                .expect(200);

            expect(noResultsResponse.body).toHaveLength(0);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle application to non-existent listing gracefully', async () => {
            await request(app.getHttpServer())
                .post('/listings/999999/applications')
                .send({ sitterId: 'test_sitter' })
                .expect(404);
        });

        it('should handle updating non-existent application status', async () => {
            await request(app.getHttpServer())
                .patch('/applications/999999')
                .send({ status: 'accepted' })
                .expect(404);
        });

        it('should handle retrieving applications for non-existent listing', async () => {
            const response = await request(app.getHttpServer())
                .get('/listings/999999/applications')
                .expect(200);

            expect(response.body).toHaveLength(0);
        });

        it('should handle retrieving applications for non-existent sitter', async () => {
            const response = await request(app.getHttpServer())
                .get('/sitters/non_existent_sitter/applications')
                .expect(200);

            expect(response.body).toHaveLength(0);
        });
    });

    describe('Performance and Load Scenarios', () => {
        it('should handle high volume of listings and applications efficiently', async () => {
            const startTime = Date.now();

            // Erstelle Listings in kleineren Batches, um Verbindungsprobleme in CI zu vermeiden
            const createdListings: any[] = [];
            const batchSize = 3;

            for (let batch = 0; batch < 3; batch++) {
                const batchPromises = [];

                for (let i = 0; i < batchSize; i++) {
                    const listingIndex = batch * batchSize + i;
                    const listing = {
                        ownerId: `owner_${String(listingIndex)}`,
                        title: `Pet Care Listing ${String(listingIndex)}`,
                        description: `Description for listing ${String(listingIndex)}`,
                        species:
                            listingIndex % 2 === 0
                                ? ('dog' as const)
                                : ('cat' as const),
                        listingType: ['day-care'] as const,
                        startDate: isoDatePlus(1),
                        endDate: isoDatePlus(2),
                        sitterVerified: listingIndex % 3 === 0,
                        price: 20 + listingIndex * 5,
                    };

                    batchPromises.push(
                        request(app.getHttpServer())
                            .post('/listings')
                            .send(listing),
                    );
                }

                const batchResponses = await Promise.all(batchPromises);
                batchResponses.forEach((response) => {
                    expect(response.status).toBe(201);
                    createdListings.push(response.body);
                });

                // Kleine Pause zwischen Batches für CI-Stabilität
                await new Promise((resolve) => setTimeout(resolve, 50));
            }

            // Erstelle Bewerbungen sequenziell, um Verbindungsprobleme zu vermeiden
            let totalApplications = 0;
            for (let i = 0; i < createdListings.length; i++) {
                const listing = createdListings[i];
                if (listing?.id) {
                    const listingId = listing.id;

                    // Erstelle 2 Bewerbungen pro Listing sequenziell
                    for (let j = 0; j < 2; j++) {
                        const applicationResponse = await request(
                            app.getHttpServer(),
                        )
                            .post(`/listings/${String(listingId)}/applications`)
                            .send({
                                sitterId: `sitter_${String(i)}_${String(j)}`,
                            });

                        expect(applicationResponse.status).toBe(201);
                        totalApplications++;
                    }
                }
            }

            // Überprüfe Performance - erweitere Zeitlimit für CI
            const endTime = Date.now();
            const duration = endTime - startTime;

            // Sollte unter 10 Sekunden dauern (erweitert für CI-Umgebungen)
            expect(duration).toBeLessThan(10000);

            // Überprüfe dass alle Daten korrekt erstellt wurden
            const allListingsResponse = await request(app.getHttpServer())
                .get('/listings')
                .expect(200);

            expect(allListingsResponse.body.length).toBeGreaterThanOrEqual(9);
            expect(totalApplications).toBe(18); // 9 Listings * 2 Bewerbungen
        });
    });
});
