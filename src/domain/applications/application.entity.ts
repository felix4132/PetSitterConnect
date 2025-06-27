export interface Application {
    id: number;
    listingId: number;
    sitterId: string;
    status: 'pending' | 'accepted' | 'rejected';
}
