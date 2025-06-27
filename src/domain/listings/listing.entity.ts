export interface Listing {
    id: number;
    ownerId: string;
    title: string;
    description: string;
    species: 'dog' | 'cat' | 'bird' | 'exotic';
    listingType: 'house-sitting' | 'drop-in-visit' | 'day-care';
    startDate: string; // ISO date
    endDate: string; // ISO date
    sitterVerified: boolean;
    price: number;
    breed: string;
    age: number;
    size: string;
    feeding: string;
    medication: string;
}
