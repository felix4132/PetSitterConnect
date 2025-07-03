import type { OnApplicationBootstrap } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from '../domain/applications/application.entity.js';
import { Listing } from '../domain/listings/listing.entity.js';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
    private readonly logger = new Logger(SeederService.name);

    constructor(
        @InjectRepository(Listing)
        private readonly listingRepository: Repository<Listing>,
        @InjectRepository(Application)
        private readonly applicationRepository: Repository<Application>,
    ) {}

    async onApplicationBootstrap() {
        try {
            await this.seedListings();
            await this.seedApplications();
        } catch (error) {
            this.logger.error('Error during seeding process:', error);
        }
    }

    private async seedListings() {
        try {
            const existingListings = await this.listingRepository.count();

            if (existingListings > 0) {
                this.logger.log('Listings already exist, skipping seeding');
                return;
            }

            const defaultListings: Partial<Listing>[] = [
                {
                    ownerId: 'owner1',
                    title: 'Liebevolle Betreuung für Golden Retriever',
                    description:
                        'Suche einen erfahrenen Hundesitter für meinen 3-jährigen Golden Retriever Max während meines Urlaubs. Er ist sehr freundlich und gut erzogen.',
                    species: 'dog',
                    listingType: ['house-sitting', 'walks'],
                    startDate: '2025-07-15',
                    endDate: '2025-07-25',
                    sitterVerified: true,
                    price: 35.0,
                    breed: 'Golden Retriever',
                    age: 3,
                    size: 'Groß',
                    feeding: '2x täglich, Trockenfutter',
                    medication: 'Keine',
                },
                {
                    ownerId: 'owner2',
                    title: 'Katzensitting für verschmuste Maine Coon',
                    description:
                        'Meine Maine Coon Katze Luna braucht liebevolle Betreuung. Sie ist sehr anhänglich und braucht viel Aufmerksamkeit.',
                    species: 'cat',
                    listingType: ['drop-in-visit', 'feeding'],
                    startDate: '2025-07-20',
                    endDate: '2025-07-30',
                    sitterVerified: false,
                    price: 25.0,
                    breed: 'Maine Coon',
                    age: 5,
                    size: 'Groß',
                    feeding: '3x täglich, Nassfutter',
                    medication: 'Keine',
                },
                {
                    ownerId: 'owner3',
                    title: 'Betreuung für Wellensittich-Paar',
                    description:
                        'Suche jemanden, der sich um meine beiden Wellensittiche Pippo und Pippi kümmert. Sie sind sehr gesellig und brauchen tägliche Aufmerksamkeit.',
                    species: 'bird',
                    listingType: ['drop-in-visit', 'feeding'],
                    startDate: '2025-08-01',
                    endDate: '2025-08-10',
                    sitterVerified: true,
                    price: 15.0,
                    breed: 'Wellensittich',
                    age: 2,
                    size: 'Klein',
                    feeding: '1x täglich, Körnermischung',
                    medication: 'Keine',
                },
            ];

            try {
                const savedListings =
                    await this.listingRepository.save(defaultListings);
                this.logger.log(
                    `Successfully seeded ${String(savedListings.length)} listings`,
                );
            } catch (error) {
                this.logger.error('Error seeding listings:', error);
            }
        } catch (error) {
            this.logger.error('Error checking existing listings:', error);
        }
    }

    private async seedApplications() {
        const existingApplications = await this.applicationRepository.count();

        if (existingApplications > 0) {
            this.logger.log('Applications already exist, skipping seeding');
            return;
        }

        // Nur Applications hinzufügen, wenn Listings vorhanden sind
        const listings = await this.listingRepository.find();
        if (listings.length === 0) {
            this.logger.log('No listings found, skipping application seeding');
            return;
        }

        const defaultApplications: Partial<Application>[] = [
            {
                listingId: listings[0]?.id,
                sitterId: 'sitter1',
                status: 'rejected', // Wurde abgelehnt, da sitter2 angenommen wurde
            },
            {
                listingId: listings[0]?.id,
                sitterId: 'sitter2',
                status: 'accepted', // Wurde angenommen
            },
            {
                listingId: listings[1]?.id,
                sitterId: 'sitter3',
                status: 'pending',
            },
            {
                listingId: listings[2]?.id,
                sitterId: 'sitter1',
                status: 'rejected',
            },
        ];

        try {
            const savedApplications =
                await this.applicationRepository.save(defaultApplications);
            this.logger.log(
                `Successfully seeded ${String(savedApplications.length)} applications`,
            );
        } catch (error) {
            this.logger.error('Error seeding applications:', error);
        }
    }
}
