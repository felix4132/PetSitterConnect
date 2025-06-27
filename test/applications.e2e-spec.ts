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
    });
});
