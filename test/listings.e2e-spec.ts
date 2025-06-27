import type { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app/app.module.ts';

const exampleListing = {
    ownerId: 'owner1',
    title: 'Test Listing',
    description: 'test desc',
    species: 'dog' as const,
    listingType: 'house-sitting' as const,
    startDate: '2025-07-01',
    endDate: '2025-07-02',
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

        // Test numeric filter (price)
        const priceFilter = await request(app.getHttpServer())
            .get('/listings?price=20')
            .expect(200);
        expect(priceFilter.body).toHaveLength(1);
        expect(priceFilter.body[0].price).toBe(20);

        // Test numeric filter (age)
        const ageFilter = await request(app.getHttpServer())
            .get('/listings?age=5')
            .expect(200);
        expect(ageFilter.body).toHaveLength(1);
        expect(ageFilter.body[0].age).toBe(5);

        // Test boolean filter
        const verifiedFilter = await request(app.getHttpServer())
            .get('/listings?sitterVerified=true')
            .expect(200);
        expect(verifiedFilter.body).toHaveLength(1);
        expect(verifiedFilter.body[0].sitterVerified).toBe(true);

        // Test string filter
        const ownerFilter = await request(app.getHttpServer())
            .get('/listings?ownerId=owner2')
            .expect(200);
        expect(ownerFilter.body).toHaveLength(1);
        expect(ownerFilter.body[0].ownerId).toBe('owner2');

        // Test multiple filters
        const multiFilter = await request(app.getHttpServer())
            .get('/listings?price=20&sitterVerified=true')
            .expect(200);
        expect(multiFilter.body).toHaveLength(1);
        expect(multiFilter.body[0].price).toBe(20);
        expect(multiFilter.body[0].sitterVerified).toBe(true);

        // Test filter with no results
        const noResults = await request(app.getHttpServer())
            .get('/listings?price=999')
            .expect(200);
        expect(noResults.body).toHaveLength(0);
    });

    it('handles invalid query parameter types gracefully', async () => {
        // Create a listing first
        await request(app.getHttpServer())
            .post('/listings')
            .send(exampleListing)
            .expect(201);

        // Test invalid numeric values - should not crash, just ignore invalid filters
        const invalidPrice = await request(app.getHttpServer())
            .get('/listings?price=invalid')
            .expect(200);
        expect(Array.isArray(invalidPrice.body)).toBe(true);

        const invalidAge = await request(app.getHttpServer())
            .get('/listings?age=notanumber')
            .expect(200);
        expect(Array.isArray(invalidAge.body)).toBe(true);

        // Test invalid boolean - should treat as false
        const invalidBoolean = await request(app.getHttpServer())
            .get('/listings?sitterVerified=invalid')
            .expect(200);
        expect(Array.isArray(invalidBoolean.body)).toBe(true);
    });
});
