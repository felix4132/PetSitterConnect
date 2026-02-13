import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app/app.module.ts';
import { isoDatePlus } from './test-helpers.ts';

const listing = {
    ownerId: 'owner2',
    title: 'Pet care',
    description: 'desc',
    species: 'cat' as const,
    listingType: ['day-care'],
    startDate: isoDatePlus(1),
    endDate: isoDatePlus(2),
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
            .send({ sitterId: 'unique-sitter-a' })
            .expect(201);

        await request(app.getHttpServer())
            .post(`/listings/${String(listingId)}/applications`)
            .send({ sitterId: 'unique-sitter-b' })
            .expect(201);

        // Get all applications for the listing
        const allApplications = await request(app.getHttpServer())
            .get(`/listings/${String(listingId)}/applications`)
            .expect(200);
        expect(allApplications.body).toHaveLength(2);

        // Get applications by each sitter — check only the newly created listing
        const sitterAApps = await request(app.getHttpServer())
            .get('/sitters/unique-sitter-a/applications')
            .expect(200);
        expect(sitterAApps.body).toHaveLength(1);
        expect(sitterAApps.body[0].sitterId).toBe('unique-sitter-a');
        expect(sitterAApps.body[0].listingId).toBe(listingId);

        const sitterBApps = await request(app.getHttpServer())
            .get('/sitters/unique-sitter-b/applications')
            .expect(200);
        expect(sitterBApps.body).toHaveLength(1);
        expect(sitterBApps.body[0].sitterId).toBe('unique-sitter-b');
        expect(sitterBApps.body[0].listingId).toBe(listingId);
    });

    it('prevents duplicate applications from the same sitter', async () => {
        // Create a listing
        const createRes = await request(app.getHttpServer())
            .post('/listings')
            .send(listing)
            .expect(201);
        const listingId: number = createRes.body.id;

        // First application should succeed
        await request(app.getHttpServer())
            .post(`/listings/${String(listingId)}/applications`)
            .send({ sitterId: 'sitter1' })
            .expect(201);

        // Second application from the same sitter should fail
        const duplicateRes = await request(app.getHttpServer())
            .post(`/listings/${String(listingId)}/applications`)
            .send({ sitterId: 'sitter1' })
            .expect(400);

        expect(duplicateRes.body.message.message).toContain('already applied');
    });

    it('handles invalid application IDs gracefully', async () => {
        // Test updating non-existent application - should return 404
        await request(app.getHttpServer())
            .patch('/applications/999999')
            .send({ status: 'accepted' })
            .expect(404);

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

    it('handles validation errors with custom messages', async () => {
        // Create a listing first
        const createRes = await request(app.getHttpServer())
            .post('/listings')
            .send(listing)
            .expect(201);
        const listingId: number = createRes.body.id;

        // Create an application first to test PATCH
        const applyRes = await request(app.getHttpServer())
            .post(`/listings/${String(listingId)}/applications`)
            .send({ sitterId: 'test-sitter' })
            .expect(201);
        const applicationId: number = applyRes.body.id;

        // Test invalid status in PATCH request — ValidationPipe @IsIn should reject with 400
        const invalidStatusRes = await request(app.getHttpServer())
            .patch(`/applications/${String(applicationId)}`)
            .send({ status: 'invalid_status' })
            .expect(400);

        expect(invalidStatusRes.body.message.message).toEqual(
            expect.arrayContaining([
                expect.stringContaining('status must be one of'),
            ]),
        );

        // Test missing sitterId in POST request — should be 400
        const missingSitterRes = await request(app.getHttpServer())
            .post(`/listings/${String(listingId)}/applications`)
            .send({})
            .expect(400);

        expect(missingSitterRes.body.message.message).toEqual(
            expect.arrayContaining([expect.stringContaining('sitterId')]),
        );

        // Test empty sitterId — ValidationPipe @IsNotEmpty should catch this
        const emptySitterRes = await request(app.getHttpServer())
            .post(`/listings/${String(listingId)}/applications`)
            .send({ sitterId: '' })
            .expect(400);

        expect(emptySitterRes.body.message.message).toEqual(
            expect.arrayContaining([expect.stringContaining('sitterId')]),
        );
    });

    it('handles application to non-existent listing gracefully', async () => {
        // Test applying to non-existent listing - should return 404
        const nonExistentRes = await request(app.getHttpServer())
            .post('/listings/999999/applications')
            .send({ sitterId: 'test-sitter' })
            .expect(404);

        expect(nonExistentRes.body.message.message).toBe(
            'Listing with ID 999999 not found',
        );
    });
});
