import type { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app/app.module.js';
import { isoDatePlus } from './test-helpers.ts';

describe('Application Auto-Rejection Logic (e2e)', () => {
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

    it('should automatically reject other applications when one is accepted', async () => {
        // 1. Erstelle ein neues Listing
        const listingResponse = await request(app.getHttpServer())
            .post('/listings')
            .send({
                ownerId: 'test-owner',
                title: 'Test Auto-Rejection Listing',
                description: 'Test listing for auto-rejection logic',
                species: 'dog',
                listingType: ['walks'],
                startDate: isoDatePlus(1),
                endDate: isoDatePlus(2),
                sitterVerified: false,
                price: 30.0,
            })
            .expect(201);

        const listingId = String(listingResponse.body.id);

        // 2. Erstelle mehrere Applications für das gleiche Listing
        const app1Response = await request(app.getHttpServer())
            .post(`/listings/${listingId}/applications`)
            .send({ sitterId: 'sitter-auto-1' })
            .expect(201);

        const app2Response = await request(app.getHttpServer())
            .post(`/listings/${listingId}/applications`)
            .send({ sitterId: 'sitter-auto-2' })
            .expect(201);

        const app3Response = await request(app.getHttpServer())
            .post(`/listings/${listingId}/applications`)
            .send({ sitterId: 'sitter-auto-3' })
            .expect(201);

        const app1Id = String(app1Response.body.id);
        const app2Id = String(app2Response.body.id);
        const app3Id = String(app3Response.body.id);

        // 3. Verifiziere, dass alle Applications 'pending' sind
        const beforeApplications = await request(app.getHttpServer())
            .get(`/listings/${listingId}/applications`)
            .expect(200);

        expect(beforeApplications.body).toHaveLength(3);
        expect(
            beforeApplications.body.every(
                (app: any) => app.status === 'pending',
            ),
        ).toBe(true);

        // 4. Akzeptiere eine Application
        await request(app.getHttpServer())
            .patch(`/applications/${app2Id}`)
            .send({ status: 'accepted' })
            .expect(200);

        // 5. Prüfe, dass die anderen automatisch abgelehnt wurden
        const afterApplications = await request(app.getHttpServer())
            .get(`/listings/${listingId}/applications`)
            .expect(200);

        expect(afterApplications.body).toHaveLength(3);

        // Finde die spezifischen Applications in der Antwort
        const app1After = afterApplications.body.find(
            (app: { id: string }) => String(app.id) === app1Id,
        );
        const app2After = afterApplications.body.find(
            (app: { id: string }) => String(app.id) === app2Id,
        );
        const app3After = afterApplications.body.find(
            (app: { id: string }) => String(app.id) === app3Id,
        );

        expect(app1After.status).toBe('rejected');
        expect(app2After.status).toBe('accepted');
        expect(app3After.status).toBe('rejected');
    });

    it('should not affect applications for different listings', async () => {
        // 1. Erstelle zwei unterschiedliche Listings
        const listing1Response = await request(app.getHttpServer())
            .post('/listings')
            .send({
                ownerId: 'test-owner-1',
                title: 'Listing 1',
                description: 'First listing',
                species: 'cat',
                listingType: ['feeding'],
                startDate: isoDatePlus(1),
                endDate: isoDatePlus(2),
                sitterVerified: false,
                price: 25.0,
            })
            .expect(201);

        const listing2Response = await request(app.getHttpServer())
            .post('/listings')
            .send({
                ownerId: 'test-owner-2',
                title: 'Listing 2',
                description: 'Second listing',
                species: 'dog',
                listingType: ['walks'],
                startDate: isoDatePlus(1),
                endDate: isoDatePlus(2),
                sitterVerified: false,
                price: 35.0,
            })
            .expect(201);

        const listing1Id = String(listing1Response.body.id);
        const listing2Id = String(listing2Response.body.id);

        // 2. Erstelle Applications für beide Listings vom gleichen Sitter
        const app1Response = await request(app.getHttpServer())
            .post(`/listings/${listing1Id}/applications`)
            .send({ sitterId: 'sitter-multi' })
            .expect(201);

        const app2Response = await request(app.getHttpServer())
            .post(`/listings/${listing2Id}/applications`)
            .send({ sitterId: 'sitter-multi' })
            .expect(201);

        const app1Id = String(app1Response.body.id);
        const app2Id = String(app2Response.body.id);

        // 3. Akzeptiere Application für Listing 1
        await request(app.getHttpServer())
            .patch(`/applications/${app1Id}`)
            .send({ status: 'accepted' })
            .expect(200);

        // 4. Prüfe, dass die Application für Listing 2 nicht beeinflusst wurde
        const listing2Applications = await request(app.getHttpServer())
            .get(`/listings/${listing2Id}/applications`)
            .expect(200);

        const app2After = listing2Applications.body.find(
            (app: { id: string }) => String(app.id) === app2Id,
        );
        expect(app2After.status).toBe('pending'); // Sollte weiterhin pending sein
    });

    it('should handle rejecting an already rejected application', async () => {
        // 1. Erstelle ein Listing
        const listingResponse = await request(app.getHttpServer())
            .post('/listings')
            .send({
                ownerId: 'test-owner',
                title: 'Test Rejection Logic',
                description: 'Test listing',
                species: 'bird',
                listingType: ['feeding'],
                startDate: isoDatePlus(1),
                endDate: isoDatePlus(2),
                sitterVerified: false,
                price: 20.0,
            })
            .expect(201);

        const listingId = String(listingResponse.body.id);

        // 2. Erstelle Applications
        const app1Response = await request(app.getHttpServer())
            .post(`/listings/${listingId}/applications`)
            .send({ sitterId: 'sitter-reject-1' })
            .expect(201);

        const app2Response = await request(app.getHttpServer())
            .post(`/listings/${listingId}/applications`)
            .send({ sitterId: 'sitter-reject-2' })
            .expect(201);

        const app1Id = String(app1Response.body.id);
        const app2Id = String(app2Response.body.id);

        // 3. Lehne eine Application manuell ab
        await request(app.getHttpServer())
            .patch(`/applications/${app1Id}`)
            .send({ status: 'rejected' })
            .expect(200);

        // 4. Akzeptiere die andere Application
        await request(app.getHttpServer())
            .patch(`/applications/${app2Id}`)
            .send({ status: 'accepted' })
            .expect(200);

        // 5. Prüfe den finalen Status
        const finalApplications = await request(app.getHttpServer())
            .get(`/listings/${listingId}/applications`)
            .expect(200);

        expect(finalApplications.body).toHaveLength(2);

        const app1Final = finalApplications.body.find(
            (app: { id: string }) => String(app.id) === app1Id,
        );
        const app2Final = finalApplications.body.find(
            (app: { id: string }) => String(app.id) === app2Id,
        );

        expect(app1Final.status).toBe('rejected');
        expect(app2Final.status).toBe('accepted');
    });
});
