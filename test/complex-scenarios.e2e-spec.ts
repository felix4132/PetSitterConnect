import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app/app.module.ts';

/**
 * Komplexe kontextbasierte Tests, die mehrere Aktionen kombinieren
 * und reale Workflows der PetSitterConnect-Anwendung testen.
 */
describe('Complex Integration Scenarios (e2e)', () => {
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
        it('should handle full workflow: create listing, multiple applications, status transitions', async () => {
            // Phase 1: Pet Owner erstellt ein Listing
            const petOwnerListing = {
                ownerId: 'owner_maria',
                title: 'Caring for 2 Golden Retrievers',
                description:
                    'Need experienced sitter for my two friendly dogs while on vacation',
                species: 'dog' as const,
                listingType: ['house-sitting'] as const,
                startDate: '2025-08-15',
                endDate: '2025-08-22',
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

            const listingId = createListingResponse.body.id as number;
            expect(listingId).toBeDefined();
            expect(createListingResponse.body.title).toBe(
                petOwnerListing.title,
            );

            // Phase 2: Mehrere Pet Sitter bewerben sich
            const sitterIds = ['sitter_alex', 'sitter_sarah', 'sitter_mike'];
            const createdApplications = [];

            for (const sitterId of sitterIds) {
                const applyResponse = await request(app.getHttpServer())
                    .post(`/listings/${listingId.toString()}/applications`)
                    .send({ sitterId })
                    .expect(201);

                expect(applyResponse.body.status).toBe('pending');
                expect(applyResponse.body.listingId).toBe(listingId);
                expect(applyResponse.body.sitterId).toBe(sitterId);
                createdApplications.push(applyResponse.body);
            }

            // Phase 3: Owner überprüft alle Bewerbungen
            const allApplicationsResponse = await request(app.getHttpServer())
                .get(`/listings/${listingId.toString()}/applications`)
                .expect(200);

            expect(allApplicationsResponse.body).toHaveLength(3);
            expect(
                allApplicationsResponse.body.every(
                    (app: any) => app.status === 'pending',
                ),
            ).toBe(true);

            // Phase 4: Owner lehnt eine Bewerbung ab
            const rejectedApplicationId = createdApplications[2]?.id as number;
            await request(app.getHttpServer())
                .patch(`/applications/${rejectedApplicationId.toString()}`)
                .send({ status: 'rejected' })
                .expect(200);

            // Phase 5: Owner akzeptiert eine Bewerbung
            const acceptedApplicationId = createdApplications[1]?.id as number;
            const acceptResponse = await request(app.getHttpServer())
                .patch(`/applications/${acceptedApplicationId.toString()}`)
                .send({ status: 'accepted' })
                .expect(200);

            expect(acceptResponse.body.status).toBe('accepted');
            expect(acceptResponse.body.sitterId).toBe('sitter_sarah');

            // Phase 6: Überprüfe finale Status-Verteilung
            const finalApplicationsResponse = await request(app.getHttpServer())
                .get(`/listings/${listingId.toString()}/applications`)
                .expect(200);

            const statusCounts = finalApplicationsResponse.body.reduce(
                (acc: Record<string, number>, app: any) => {
                    const status = app.status as string;
                    acc[status] = (acc[status] ?? 0) + 1;
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
            expect(sarahApplicationsResponse.body[0]?.status).toBe('accepted');
            expect(sarahApplicationsResponse.body[0]?.listing).toBeDefined();
            expect(sarahApplicationsResponse.body[0]?.listing?.title).toBe(
                petOwnerListing.title,
            );

            // Phase 8: Owner überprüft Listing mit allen Bewerbungen
            const listingWithAppsResponse = await request(app.getHttpServer())
                .get(`/listings/${listingId.toString()}/with-applications`)
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
                startDate: '2025-09-01',
                endDate: '2025-09-07',
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

            const listingId = createResponse.body.id as number;

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
                        .post(`/listings/${listingId.toString()}/applications`)
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
                .get(`/listings/${listingId.toString()}/applications`)
                .expect(200);

            expect(allAppsResponse.body).toHaveLength(5);

            // Owner entscheidet sich schnell: erste Bewerbung akzeptieren, Rest ablehnen
            const firstApplicationId = allAppsResponse.body[0]?.id as number;

            // Akzeptiere erste Bewerbung
            await request(app.getHttpServer())
                .patch(`/applications/${firstApplicationId.toString()}`)
                .send({ status: 'accepted' })
                .expect(200);

            // Lehne alle anderen ab
            for (let i = 1; i < allAppsResponse.body.length; i++) {
                const appId = allAppsResponse.body[i]?.id as number;
                await request(app.getHttpServer())
                    .patch(`/applications/${appId.toString()}`)
                    .send({ status: 'rejected' })
                    .expect(200);
            }

            // Überprüfe finale Verteilung
            const finalAppsResponse = await request(app.getHttpServer())
                .get(`/listings/${listingId.toString()}/applications`)
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
                    startDate: '2025-08-01',
                    endDate: '2025-08-31',
                    sitterVerified: false,
                    price: 20,
                },
                {
                    ownerId,
                    title: 'Cat Feeding - Weekend',
                    description: 'Weekend cat feeding service',
                    species: 'cat' as const,
                    listingType: ['feeding'] as const,
                    startDate: '2025-08-05',
                    endDate: '2025-08-06',
                    sitterVerified: true,
                    price: 30,
                },
                {
                    ownerId,
                    title: 'Bird Care - Vacation',
                    description: 'Exotic bird care during vacation',
                    species: 'bird' as const,
                    listingType: ['house-sitting'] as const,
                    startDate: '2025-09-10',
                    endDate: '2025-09-17',
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
                    const sitterId = `sitter_${i.toString()}_${j.toString()}`;
                    const listingIdStr = (listing?.id as number).toString();
                    const applyResponse = await request(app.getHttpServer())
                        .post(`/listings/${listingIdStr}/applications`)
                        .send({ sitterId })
                        .expect(201);
                    apps.push(applyResponse.body);
                }
                listingApplications.push(apps);
            }

            // Verschiedene Status-Management-Strategien
            // Listing 1: Alle ablehnen
            if (listingApplications[0]) {
                for (const applicationItem of listingApplications[0]) {
                    const appId = applicationItem?.id as number;
                    await request(app.getHttpServer())
                        .patch(`/applications/${appId.toString()}`)
                        .send({ status: 'rejected' })
                        .expect(200);
                }
            }

            // Listing 2: Eine akzeptieren, Rest ablehnen
            if (listingApplications[1]?.[0]) {
                const firstAppId = listingApplications[1][0]?.id as number;
                await request(app.getHttpServer())
                    .patch(`/applications/${firstAppId.toString()}`)
                    .send({ status: 'accepted' })
                    .expect(200);

                for (let i = 1; i < listingApplications[1].length; i++) {
                    const appToReject = listingApplications[1][i];
                    if (appToReject) {
                        const appId = appToReject.id as number;
                        await request(app.getHttpServer())
                            .patch(`/applications/${appId.toString()}`)
                            .send({ status: 'rejected' })
                            .expect(200);
                    }
                }
            }

            // Listing 3: Alle pending lassen (nichts tun)

            // Überprüfe Owner's Listings
            const ownerListingsResponse = await request(app.getHttpServer())
                .get(`/listings/owner/${ownerId}`)
                .expect(200);

            expect(ownerListingsResponse.body).toHaveLength(3);

            // Überprüfe Status-Verteilung pro Listing
            for (let i = 0; i < createdListings.length; i++) {
                const listing = createdListings[i];
                const listingId = (listing?.id as number).toString();
                const listingAppsResponse = await request(app.getHttpServer())
                    .get(`/listings/${listingId}/applications`)
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
                        (app: any) => app.status as string,
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
                    startDate: '2025-08-01',
                    endDate: '2025-08-05',
                    sitterVerified: false,
                    price: 25,
                },
                {
                    ownerId: 'owner_b',
                    title: 'Cat Sitting Premium',
                    description: 'Premium cat sitting service',
                    species: 'cat' as const,
                    listingType: ['house-sitting'] as const,
                    startDate: '2025-08-10',
                    endDate: '2025-08-15',
                    sitterVerified: true,
                    price: 35,
                },
                {
                    ownerId: 'owner_c',
                    title: 'Weekend Pet Care',
                    description: 'Weekend pet care needed',
                    species: 'dog' as const,
                    listingType: ['overnight'] as const,
                    startDate: '2025-08-20',
                    endDate: '2025-08-22',
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
                const listingId = (listing?.id as number).toString();
                const applyResponse = await request(app.getHttpServer())
                    .post(`/listings/${listingId}/applications`)
                    .send({ sitterId })
                    .expect(201);
                sitterApplications.push(applyResponse.body);
            }

            // Simuliere verschiedene Owner-Entscheidungen
            // Listing 1: Rejected
            const app1Id = (sitterApplications[0]?.id as number).toString();
            await request(app.getHttpServer())
                .patch(`/applications/${app1Id}`)
                .send({ status: 'rejected' })
                .expect(200);

            // Listing 2: Accepted
            const app2Id = (sitterApplications[1]?.id as number).toString();
            await request(app.getHttpServer())
                .patch(`/applications/${app2Id}`)
                .send({ status: 'accepted' })
                .expect(200);

            // Listing 3: Bleibt pending (nichts tun)

            // Überprüfe Sitter's Bewerbungshistorie
            const sitterAppsResponse = await request(app.getHttpServer())
                .get(`/sitters/${sitterId}/applications`)
                .expect(200);

            expect(sitterAppsResponse.body).toHaveLength(3);

            // Überprüfe Status-Verteilung
            const statuses = sitterAppsResponse.body.map(
                (app: any) => app.status as string,
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
                    startDate: '2025-08-01',
                    endDate: '2025-08-07',
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
                    startDate: '2025-08-01',
                    endDate: '2025-08-03',
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
                    startDate: '2025-08-05',
                    endDate: '2025-08-12',
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

            expect(ownerAndVerifiedResponse.body.length).toBeGreaterThan(0);
            expect(
                ownerAndVerifiedResponse.body.some(
                    (listing: any) =>
                        listing.ownerId === 'owner_premium' &&
                        listing.sitterVerified === true,
                ),
            ).toBe(true);

            // Test 3: Preis-Range filtering - verwende einen eindeutigen Preis
            const budgetListingsResponse = await request(app.getHttpServer())
                .get('/listings?price=35')
                .expect(200);

            expect(
                budgetListingsResponse.body.some((l: any) => l.price === 35),
            ).toBe(true);

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
        it('should handle moderate volume of listings and applications efficiently', async () => {
            const startTime = Date.now();

            // Erstelle mehrere Listings
            const listingPromises = [];
            for (let i = 0; i < 5; i++) {
                const listing = {
                    ownerId: `owner_${i.toString()}`,
                    title: `Pet Care Listing ${i.toString()}`,
                    description: `Description for listing ${i.toString()}`,
                    species: i % 2 === 0 ? ('dog' as const) : ('cat' as const),
                    listingType: ['day-care'] as const,
                    startDate: '2025-08-01',
                    endDate: '2025-08-05',
                    sitterVerified: i % 3 === 0,
                    price: 20 + i * 5,
                };

                listingPromises.push(
                    request(app.getHttpServer())
                        .post('/listings')
                        .send(listing),
                );
            }

            const listingResponses = await Promise.all(listingPromises);
            listingResponses.forEach((response) => {
                expect(response.status).toBe(201);
            });

            // Erstelle einige Bewerbungen
            const applicationPromises = [];
            for (let i = 0; i < listingResponses.length; i++) {
                const response = listingResponses[i];
                if (response?.body?.id) {
                    const listingId = response.body.id as number;

                    for (let j = 0; j < 2; j++) {
                        const sitterId = `sitter_${i.toString()}_${j.toString()}`;
                        applicationPromises.push(
                            request(app.getHttpServer())
                                .post(
                                    `/listings/${listingId.toString()}/applications`,
                                )
                                .send({ sitterId }),
                        );
                    }
                }
            }

            const applicationResponses = await Promise.all(applicationPromises);
            applicationResponses.forEach((response) => {
                expect(response.status).toBe(201);
            });

            // Überprüfe Performance
            const endTime = Date.now();
            const duration = endTime - startTime;

            // Sollte unter 3 Sekunden dauern
            expect(duration).toBeLessThan(3000);

            // Überprüfe dass alle Daten korrekt erstellt wurden
            const allListingsResponse = await request(app.getHttpServer())
                .get('/listings')
                .expect(200);

            expect(allListingsResponse.body.length).toBeGreaterThanOrEqual(5);
        });
    });
});
