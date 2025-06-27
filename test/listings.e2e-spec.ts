import type { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app/app.module.ts';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

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
});
