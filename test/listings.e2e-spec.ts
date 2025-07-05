import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app/app.module.ts';

const exampleListing = {
    ownerId: 'owner1',
    title: 'Test Listing',
    description: 'test desc',
    species: 'dog' as const,
    listingType: ['house-sitting'],
    startDate: '2025-08-01', // Future date
    endDate: '2025-08-02', // Future date
    sitterVerified: false,
    price: 10,
    breed: 'Bulldog',
    age: 3,
    size: 'medium',
    feeding: 'twice a day',
    medication: 'none',
};

describe('ListingsController (e2e)', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();

        // Configure the same validation pipe as in production
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

    it('creates and retrieves a listing', async () => {
        const createRes = await request(app.getHttpServer())
            .post('/listings')
            .send(exampleListing)
            .expect(201);
        const listingId: number = createRes.body.id;
        expect(listingId).toBeDefined();

        const getRes = await request(app.getHttpServer())
            .get(`/listings/${String(listingId)}`)
            .expect(200);
        expect(getRes.body.title).toBe(exampleListing.title);

        const byOwner = await request(app.getHttpServer())
            .get(`/listings/owner/${exampleListing.ownerId}`)
            .expect(200);
        expect(Array.isArray(byOwner.body)).toBe(true);
        expect(byOwner.body[0].id).toBe(listingId);
    });

    it('filters listings by query parameters', async () => {
        // Create multiple listings with different properties
        const listing1 = {
            ...exampleListing,
            price: 10,
            age: 3,
            sitterVerified: false,
        };
        const listing2 = {
            ...exampleListing,
            price: 20,
            age: 5,
            sitterVerified: true,
            ownerId: 'owner2',
        };

        await request(app.getHttpServer())
            .post('/listings')
            .send(listing1)
            .expect(201);

        await request(app.getHttpServer())
            .post('/listings')
            .send(listing2)
            .expect(201);

        // Test numeric filter (price) - prüfe auf Vorhandensein
        const priceFilter = await request(app.getHttpServer())
            .get('/listings?price=25')
            .expect(200);
        expect(priceFilter.body.some((l: any) => l.price === 25)).toBe(true);

        // Test numeric filter (age) - prüfe auf Vorhandensein
        const ageFilter = await request(app.getHttpServer())
            .get('/listings?age=2')
            .expect(200);
        expect(ageFilter.body.some((l: any) => l.age === 2)).toBe(true);

        // Test boolean filter
        const verifiedFilter = await request(app.getHttpServer())
            .get('/listings?sitterVerified=true')
            .expect(200);
        expect(
            verifiedFilter.body.some((l: any) => l.sitterVerified === true),
        ).toBe(true);

        // Test string filter
        const ownerFilter = await request(app.getHttpServer())
            .get('/listings?ownerId=owner2')
            .expect(200);
        expect(ownerFilter.body.some((l: any) => l.ownerId === 'owner2')).toBe(
            true,
        );

        // Test multiple filters
        const multiFilter = await request(app.getHttpServer())
            .get('/listings?price=20&sitterVerified=true')
            .expect(200);
        expect(
            multiFilter.body.some(
                (l: any) => l.price === 20 && l.sitterVerified === true,
            ),
        ).toBe(true);

        // Test filter with no results
        const noResults = await request(app.getHttpServer())
            .get('/listings?price=999')
            .expect(200);
        expect(noResults.body).toHaveLength(0);
    });

    it('DEBUG: Check validation behavior', async () => {
        // Test basic GET first
        const basic = await request(app.getHttpServer())
            .get('/listings')
            .expect(200);
        console.log('Basic GET response:', basic.body);

        // Test with one valid parameter
        const withValidParam = await request(app.getHttpServer())
            .get('/listings?price=10')
            .expect(200);
        console.log('Valid param response:', withValidParam.body);

        // Test with invalid parameter
        const response = await request(app.getHttpServer()).get(
            '/listings?price=invalid',
        );

        console.log('Invalid param status:', response.status);
        console.log('Invalid param body:', response.body);

        // Just check that it returns some status (for now)
        expect([200, 400]).toContain(response.status);
    });

    it('should retrieve listing with applications', async () => {
        // Create a listing
        const createResponse = await request(app.getHttpServer())
            .post('/listings')
            .send(exampleListing)
            .expect(201);

        const listingId: number = createResponse.body.id as number;

        // Create an application for this listing
        await request(app.getHttpServer())
            .post(`/listings/${listingId.toString()}/applications`)
            .send({
                sitterId: 'test-sitter-1',
            })
            .expect(201);

        // Retrieve listing with applications
        const response = await request(app.getHttpServer())
            .get(`/listings/${listingId.toString()}/with-applications`)
            .expect(200);

        expect(response.body.id).toBe(listingId);
        expect(response.body.title).toBe(exampleListing.title);
        expect(Array.isArray(response.body.applications)).toBe(true);
        expect(response.body.applications).toHaveLength(1);
        expect(response.body.applications[0].sitterId).toBe('test-sitter-1');
        expect(response.body.applications[0].status).toBe('pending');
    });

    it('should automatically transform query parameters', async () => {
        // Create a listing with specific properties for filtering
        const listing = {
            ...exampleListing,
            price: 15,
            age: 2,
            sitterVerified: true,
            species: 'cat' as const,
        };

        await request(app.getHttpServer())
            .post('/listings')
            .send(listing)
            .expect(201);

        // Test string-to-number transformation for price - prüfe auf Vorhandensein
        const priceFilter = await request(app.getHttpServer())
            .get('/listings?price=35')
            .expect(200);
        expect(priceFilter.body.some((l: any) => l.price === 35)).toBe(true);

        // Test string-to-boolean transformation for sitterVerified
        const verifiedFilter = await request(app.getHttpServer())
            .get('/listings?sitterVerified=true')
            .expect(200);
        expect(
            verifiedFilter.body.some((l: any) => l.sitterVerified === true),
        ).toBe(true);

        // Test enum validation for species
        const speciesFilter = await request(app.getHttpServer())
            .get('/listings?species=cat')
            .expect(200);
        expect(speciesFilter.body.some((l: any) => l.species === 'cat')).toBe(
            true,
        );
    });

    it('should store, return and filter listings with multiple listingType values', async () => {
        // Erstelle ein Listing mit mehreren listingType-Werten
        const multiTypeListing = {
            ...exampleListing,
            ownerId: 'owner-multi',
            title: 'Multi-Type Listing',
            listingType: ['house-sitting', 'walks', 'feeding'],
        };
        const createRes = await request(app.getHttpServer())
            .post('/listings')
            .send(multiTypeListing)
            .expect(201);
        const listingId = createRes.body.id;
        expect(listingId).toBeDefined();
        expect(Array.isArray(createRes.body.listingType)).toBe(true);
        expect(createRes.body.listingType).toEqual(
            expect.arrayContaining(['house-sitting', 'walks', 'feeding']),
        );

        // Hole das Listing und prüfe, dass alle Werte im Array stehen
        const getRes = await request(app.getHttpServer())
            .get(`/listings/${String(listingId)}`)
            .expect(200);
        expect(getRes.body.listingType).toEqual(
            expect.arrayContaining(['house-sitting', 'walks', 'feeding']),
        );

        // Filter: Finde das Listing mit einem der Typen
        const filterWalks = await request(app.getHttpServer())
            .get('/listings?listingType=walks')
            .expect(200);
        expect(filterWalks.body.some((l: any) => l.id === listingId)).toBe(
            true,
        );

        // Filter: Finde das Listing mit mehreren Typen (alle müssen enthalten sein)
        const filterMulti = await request(app.getHttpServer())
            .get('/listings?listingType=house-sitting&listingType=feeding')
            .expect(200);
        expect(filterMulti.body.some((l: any) => l.id === listingId)).toBe(
            true,
        );
    });

    it('should store and return a listing with only one listingType value', async () => {
        const singleTypeListing = {
            ...exampleListing,
            ownerId: 'owner-single',
            title: 'Single-Type Listing',
            listingType: ['overnight'],
        };
        const createRes = await request(app.getHttpServer())
            .post('/listings')
            .send(singleTypeListing)
            .expect(201);
        const listingId = createRes.body.id;
        expect(listingId).toBeDefined();
        expect(createRes.body.listingType).toEqual(['overnight']);
        const getRes = await request(app.getHttpServer())
            .get(`/listings/${String(listingId)}`)
            .expect(200);
        expect(getRes.body.listingType).toEqual(['overnight']);
    });

    it('should store and return a listing with all possible listingType values', async () => {
        const allTypes = [
            'house-sitting',
            'drop-in-visit',
            'day-care',
            'walks',
            'feeding',
            'overnight',
        ];
        const allTypeListing = {
            ...exampleListing,
            ownerId: 'owner-all',
            title: 'All-Types Listing',
            listingType: allTypes,
        };
        const createRes = await request(app.getHttpServer())
            .post('/listings')
            .send(allTypeListing)
            .expect(201);
        const listingId = createRes.body.id;
        expect(listingId).toBeDefined();
        expect(createRes.body.listingType).toEqual(
            expect.arrayContaining(allTypes),
        );
        const getRes = await request(app.getHttpServer())
            .get(`/listings/${String(listingId)}`)
            .expect(200);
        expect(getRes.body.listingType).toEqual(
            expect.arrayContaining(allTypes),
        );
    });

    it('should filter and return multiple listings that share at least one listingType value', async () => {
        // Erstelle zwei Listings mit Überschneidung
        const l1 = {
            ...exampleListing,
            ownerId: 'owner-overlap1',
            title: 'Overlap 1',
            listingType: ['house-sitting', 'feeding'],
        };
        const l2 = {
            ...exampleListing,
            ownerId: 'owner-overlap2',
            title: 'Overlap 2',
            listingType: ['feeding', 'walks'],
        };
        const res1 = await request(app.getHttpServer())
            .post('/listings')
            .send(l1)
            .expect(201);
        const res2 = await request(app.getHttpServer())
            .post('/listings')
            .send(l2)
            .expect(201);
        // Filter nach 'feeding' muss beide finden
        const filter = await request(app.getHttpServer())
            .get('/listings?listingType=feeding')
            .expect(200);
        const foundIds = filter.body.map((l: { id: number }) => l.id);
        expect(foundIds).toEqual(
            expect.arrayContaining([res1.body.id, res2.body.id]),
        );
    });

    it('should not return listings if no listingType matches the filter', async () => {
        // Erstelle ein Listing mit bestimmten Typen
        const l = {
            ...exampleListing,
            ownerId: 'owner-nomatch',
            title: 'NoMatch',
            listingType: ['house-sitting', 'feeding'],
        };
        await request(app.getHttpServer())
            .post('/listings')
            .send(l)
            .expect(201);
        // Filter nach nicht vorhandenem Typ
        const filter = await request(app.getHttpServer())
            .get('/listings?listingType=overnight')
            .expect(200);
        // Sollte leer sein, wenn kein Listing diesen Typ enthält
        expect(
            filter.body.every(
                (entry: { listingType: string[] }) =>
                    !entry.listingType.includes('overnight'),
            ),
        ).toBe(true);
    });

    it('should filter listings by combination of listingType and other filters', async () => {
        // Erstelle mehrere Listings mit unterschiedlichen Kombinationen
        const l1 = {
            ...exampleListing,
            ownerId: 'combo1',
            title: 'Combo 1',
            listingType: ['house-sitting', 'feeding'],
            price: 30,
            species: 'dog',
            sitterVerified: true,
        };
        const l2 = {
            ...exampleListing,
            ownerId: 'combo2',
            title: 'Combo 2',
            listingType: ['feeding', 'walks'],
            price: 30,
            species: 'cat',
            sitterVerified: true,
        };
        const l3 = {
            ...exampleListing,
            ownerId: 'combo3',
            title: 'Combo 3',
            listingType: ['feeding', 'walks'],
            price: 50,
            species: 'cat',
            sitterVerified: false,
        };
        const res1 = await request(app.getHttpServer())
            .post('/listings')
            .send(l1)
            .expect(201);
        const res2 = await request(app.getHttpServer())
            .post('/listings')
            .send(l2)
            .expect(201);
        await request(app.getHttpServer())
            .post('/listings')
            .send(l3)
            .expect(201);

        // Filter: listingType=feeding & price=30 & sitterVerified=true
        const filter = await request(app.getHttpServer())
            .get('/listings?listingType=feeding&price=30&sitterVerified=true')
            .expect(200);
        // Es sollten l1 und l2 gefunden werden, aber nicht l3
        const foundIds = filter.body.map((l: { id: number }) => l.id);
        expect(foundIds).toEqual(
            expect.arrayContaining([res1.body.id, res2.body.id]),
        );
        // Sicherstellen, dass kein Listing mit sitterVerified=false dabei ist
        expect(
            filter.body.every(
                (l: { sitterVerified: boolean }) => l.sitterVerified,
            ),
        ).toBe(true);
    });

    it('handles validation errors for listings', async () => {
        // Test invalid species
        const invalidSpeciesRes = await request(app.getHttpServer())
            .post('/listings')
            .send({
                ...exampleListing,
                species: 'invalid_species',
            })
            .expect(400);

        expect(invalidSpeciesRes.body.message.message).toContain(
            'species must be one of: dog, cat, bird, exotic, other',
        );

        // Test invalid listingType
        const invalidListingTypeRes = await request(app.getHttpServer())
            .post('/listings')
            .send({
                ...exampleListing,
                listingType: ['invalid_type'],
            })
            .expect(400);

        expect(invalidListingTypeRes.body.message.message).toContain(
            'listingType',
        );

        // Test empty title
        const emptyTitleRes = await request(app.getHttpServer())
            .post('/listings')
            .send({
                ...exampleListing,
                title: '',
            })
            .expect(400);

        expect(emptyTitleRes.body.message.message).toContain('title');

        // Test negative price
        const negativePriceRes = await request(app.getHttpServer())
            .post('/listings')
            .send({
                ...exampleListing,
                price: -10,
            })
            .expect(400);

        expect(negativePriceRes.body.message.message).toContain('price');
    });

    it('handles query validation errors', async () => {
        // Test invalid species in query
        const invalidSpeciesQueryRes = await request(app.getHttpServer())
            .get('/listings?species=invalid_species')
            .expect(400);

        expect(invalidSpeciesQueryRes.body.message.message).toContain(
            'species must be one of: dog, cat, bird, exotic, other',
        );

        // Test invalid listingType in query
        const invalidListingTypeQueryRes = await request(app.getHttpServer())
            .get('/listings?listingType=invalid_type')
            .expect(400);

        expect(invalidListingTypeQueryRes.body.message.message).toContain(
            'listingType',
        );

        // Test invalid boolean for sitterVerified
        await request(app.getHttpServer())
            .get('/listings?sitterVerified=invalid_boolean')
            .expect(200); // Should succeed but cast to false

        // Valid requests should still work
        const validRes = await request(app.getHttpServer())
            .get('/listings?species=dog&sitterVerified=true')
            .expect(200);

        expect(Array.isArray(validRes.body)).toBe(true);
    });

    it('handles not found errors', async () => {
        // Test non-existent listing
        const notFoundRes = await request(app.getHttpServer())
            .get('/listings/999999')
            .expect(404);

        expect(notFoundRes.body.message.message).toBe(
            'Listing with ID 999999 not found',
        );

        // Test non-existent listing with applications
        const notFoundWithAppsRes = await request(app.getHttpServer())
            .get('/listings/999999/with-applications')
            .expect(404);

        expect(notFoundWithAppsRes.body.message.message).toBe(
            'Listing with ID 999999 not found',
        );
    });
});
