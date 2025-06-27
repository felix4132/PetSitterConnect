import type { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app/app.module.ts';

const listing = {
    ownerId: 'owner2',
    title: 'Pet care',
    description: 'desc',
    species: 'cat' as const,
    listingType: 'day-care' as const,
    startDate: '2025-08-01',
    endDate: '2025-08-02',
    sitterVerified: false,
    price: 15,
    breed: 'Siamese',
    age: 2,
    size: 'small',
    feeding: 'once',
    medication: 'none',
};

describe('ApplicationsController (e2e)', () => {
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

    it('allows sitters to apply and update status', async () => {
        const createRes = await request(app.getHttpServer())
            .post('/listings')
            .send(listing)
            .expect(201);
        const listingId: number = createRes.body.id;

        const applyRes = await request(app.getHttpServer())
            .post(`/listings/${String(listingId)}/applications`)
            .send({ sitterId: 'sitter1' })
            .expect(201);
        const appId: number = applyRes.body.id;
        expect(applyRes.body.status).toBe('pending');

        await request(app.getHttpServer())
            .patch(`/applications/${String(appId)}`)
            .send({ status: 'accepted' })
            .expect(200);

        const bySitter = await request(app.getHttpServer())
            .get('/sitters/sitter1/applications')
            .expect(200);
        expect(bySitter.body[0].status).toBe('accepted');

        // Test getting applications by listing
        const byListing = await request(app.getHttpServer())
            .get(`/listings/${String(listingId)}/applications`)
            .expect(200);
        expect(byListing.body).toHaveLength(1);
        expect(byListing.body[0].id).toBe(appId);
    });

    it('handles multiple applications for the same listing', async () => {
        // Create a listing
        const createRes = await request(app.getHttpServer())
            .post('/listings')
            .send(listing)
            .expect(201);
        const listingId: number = createRes.body.id;

        // Create multiple applications
        await request(app.getHttpServer())
            .post(`/listings/${String(listingId)}/applications`)
            .send({ sitterId: 'sitter1' })
            .expect(201);

        await request(app.getHttpServer())
            .post(`/listings/${String(listingId)}/applications`)
            .send({ sitterId: 'sitter2' })
            .expect(201);

        // Get all applications for the listing
        const allApplications = await request(app.getHttpServer())
            .get(`/listings/${String(listingId)}/applications`)
            .expect(200);
        expect(allApplications.body).toHaveLength(2);

        // Get applications by each sitter
        const sitter1Apps = await request(app.getHttpServer())
            .get('/sitters/sitter1/applications')
            .expect(200);
        expect(sitter1Apps.body).toHaveLength(1);
        expect(sitter1Apps.body[0].sitterId).toBe('sitter1');

        const sitter2Apps = await request(app.getHttpServer())
            .get('/sitters/sitter2/applications')
            .expect(200);
        expect(sitter2Apps.body).toHaveLength(1);
        expect(sitter2Apps.body[0].sitterId).toBe('sitter2');
    });

    it('handles invalid application IDs gracefully', async () => {
        // Test updating non-existent application - returns empty object when undefined
        const updateRes = await request(app.getHttpServer())
            .patch('/applications/999999')
            .send({ status: 'accepted' })
            .expect(200);
        expect(updateRes.body).toEqual({});

        // Test getting applications for non-existent sitter
        const noSitterApps = await request(app.getHttpServer())
            .get('/sitters/nonexistent/applications')
            .expect(200);
        expect(noSitterApps.body).toHaveLength(0);

        // Test getting applications for non-existent listing
        const noListingApps = await request(app.getHttpServer())
            .get('/listings/999999/applications')
            .expect(200);
        expect(noListingApps.body).toHaveLength(0);
    });
});
