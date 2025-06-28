import { beforeEach, describe, expect, it } from 'vitest';
import type { Listing } from '../src/domain/listings/listing.entity.ts';
import { DatabaseService } from '../src/infrastructure/database/database.service.ts';

describe('DatabaseService', () => {
    let service: DatabaseService;

    beforeEach(() => {
        service = new DatabaseService();
    });

    describe('Listings', () => {
        describe('addListing', () => {
            it('should add a new listing with auto-incremented id', () => {
                // Arrange
                const listingData = {
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

                // Act
                const result = service.addListing(listingData);

                // Assert
                expect(result.id).toBe(1);
                expect(result).toEqual({ id: 1, ...listingData });
            });

            it('should increment id for multiple listings', () => {
                // Arrange
                const listingData = {
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

                // Act
                const first = service.addListing(listingData);
                const second = service.addListing(listingData);

                // Assert
                expect(first.id).toBe(1);
                expect(second.id).toBe(2);
            });
        });

        describe('getListing', () => {
            it('should return listing by id', () => {
                // Arrange
                const listingData = {
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
                const addedListing = service.addListing(listingData);

                // Act
                const result = service.getListing(addedListing.id);

                // Assert
                expect(result).toEqual(addedListing);
            });

            it('should return undefined for non-existent listing', () => {
                // Act
                const result = service.getListing(999);

                // Assert
                expect(result).toBeUndefined();
            });
        });

        describe('getListings', () => {
            it('should return all listings', () => {
                // Arrange
                const listingData1 = {
                    ownerId: 'owner1',
                    title: 'Test Listing 1',
                    description: 'test desc 1',
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
                const listingData2 = {
                    ...listingData1,
                    title: 'Test Listing 2',
                    ownerId: 'owner2',
                };

                const listing1 = service.addListing(listingData1);
                const listing2 = service.addListing(listingData2);

                // Act
                const result = service.getListings();

                // Assert
                expect(result).toHaveLength(2);
                expect(result).toContain(listing1);
                expect(result).toContain(listing2);
            });

            it('should return empty array when no listings', () => {
                // Act
                const result = service.getListings();

                // Assert
                expect(result).toEqual([]);
            });
        });
    });

    describe('Applications', () => {
        let testListing: Listing;

        beforeEach(() => {
            // Add a test listing first
            testListing = service.addListing({
                ownerId: 'owner1',
                title: 'Test Listing',
                description: 'test desc',
                species: 'dog',
                listingType: 'house-sitting',
                startDate: '2025-07-01',
                endDate: '2025-07-02',
                sitterVerified: false,
                price: 10,
                breed: 'Bulldog',
                age: 3,
                size: 'medium',
                feeding: 'twice a day',
                medication: 'none',
            });
        });

        describe('addApplication', () => {
            it('should add a new application with auto-incremented id and pending status', () => {
                // Arrange
                const applicationData = {
                    listingId: testListing.id,
                    sitterId: 'sitter1',
                };

                // Act
                const result = service.addApplication(applicationData);

                // Assert
                expect(result.id).toBe(1);
                expect(result.status).toBe('pending');
                expect(result.listingId).toBe(testListing.id);
                expect(result.sitterId).toBe('sitter1');
            });

            it('should increment id for multiple applications', () => {
                // Arrange
                const applicationData = {
                    listingId: testListing.id,
                    sitterId: 'sitter1',
                };

                // Act
                const first = service.addApplication(applicationData);
                const second = service.addApplication({
                    ...applicationData,
                    sitterId: 'sitter2',
                });

                // Assert
                expect(first.id).toBe(1);
                expect(second.id).toBe(2);
            });
        });

        describe('getApplication', () => {
            it('should return application by id', () => {
                // Arrange
                const applicationData = {
                    listingId: testListing.id,
                    sitterId: 'sitter1',
                };
                const addedApplication =
                    service.addApplication(applicationData);

                // Act
                const result = service.getApplication(addedApplication.id);

                // Assert
                expect(result).toEqual(addedApplication);
            });

            it('should return undefined for non-existent application', () => {
                // Act
                const result = service.getApplication(999);

                // Assert
                expect(result).toBeUndefined();
            });
        });

        describe('updateApplicationStatus', () => {
            it('should update application status', () => {
                // Arrange
                const applicationData = {
                    listingId: testListing.id,
                    sitterId: 'sitter1',
                };
                const application = service.addApplication(applicationData);

                // Act
                const result = service.updateApplicationStatus(
                    application.id,
                    'accepted',
                );

                // Assert
                expect(result?.status).toBe('accepted');
                expect(result?.id).toBe(application.id);
            });

            it('should return undefined for non-existent application', () => {
                // Act
                const result = service.updateApplicationStatus(999, 'accepted');

                // Assert
                expect(result).toBeUndefined();
            });
        });

        describe('getApplicationsBySitter', () => {
            it('should return applications for specific sitter', () => {
                // Arrange
                const app1 = service.addApplication({
                    listingId: testListing.id,
                    sitterId: 'sitter1',
                });
                service.addApplication({
                    listingId: testListing.id,
                    sitterId: 'sitter2',
                });
                const app3 = service.addApplication({
                    listingId: testListing.id,
                    sitterId: 'sitter1',
                });

                // Act
                const result = service.getApplicationsBySitter('sitter1');

                // Assert
                expect(result).toHaveLength(2);
                expect(result).toContain(app1);
                expect(result).toContain(app3);
            });

            it('should return empty array for sitter with no applications', () => {
                // Act
                const result =
                    service.getApplicationsBySitter('nonexistent-sitter');

                // Assert
                expect(result).toEqual([]);
            });
        });

        describe('getApplicationsByListing', () => {
            it('should return applications for specific listing', () => {
                // Arrange
                const listing2 = service.addListing({
                    ownerId: 'owner2',
                    title: 'Test Listing 2',
                    description: 'test desc 2',
                    species: 'cat',
                    listingType: 'day-care',
                    startDate: '2025-08-01',
                    endDate: '2025-08-02',
                    sitterVerified: true,
                    price: 20,
                    breed: 'Siamese',
                    age: 2,
                    size: 'small',
                    feeding: 'once',
                    medication: 'none',
                });

                const app1 = service.addApplication({
                    listingId: testListing.id,
                    sitterId: 'sitter1',
                });
                service.addApplication({
                    listingId: listing2.id,
                    sitterId: 'sitter2',
                });
                const app3 = service.addApplication({
                    listingId: testListing.id,
                    sitterId: 'sitter3',
                });

                // Act
                const result = service.getApplicationsByListing(testListing.id);

                // Assert
                expect(result).toHaveLength(2);
                expect(result).toContain(app1);
                expect(result).toContain(app3);
            });

            it('should return empty array for listing with no applications', () => {
                // Act
                const result = service.getApplicationsByListing(999);

                // Assert
                expect(result).toEqual([]);
            });
        });
    });
});
