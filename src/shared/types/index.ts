/**
 * Shared types and constants for the PetSitterConnect application
 */

export type Species = 'dog' | 'cat' | 'bird' | 'exotic' | 'other';

export const SPECIES_VALUES: Species[] = [
    'dog',
    'cat',
    'bird',
    'exotic',
    'other',
];

export type ListingType =
    | 'house-sitting'
    | 'drop-in-visit'
    | 'day-care'
    | 'walks'
    | 'feeding'
    | 'overnight';

export const LISTING_TYPE_VALUES: ListingType[] = [
    'house-sitting',
    'drop-in-visit',
    'day-care',
    'walks',
    'feeding',
    'overnight',
];

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export const APPLICATION_STATUS_VALUES: ApplicationStatus[] = [
    'pending',
    'accepted',
    'rejected',
];

export const VALIDATION_MESSAGES = {
    species: `species must be one of: ${SPECIES_VALUES.join(', ')}`,
    listingType: `each listingType must be one of: ${LISTING_TYPE_VALUES.join(', ')}`,
    applicationStatus: `status must be one of: ${APPLICATION_STATUS_VALUES.join(', ')}`,
} as const;
