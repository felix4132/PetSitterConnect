import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Listing } from '../listings/listing.entity.js';

@Entity('applications')
export class Application {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('integer')
    listingId!: number;

    @Column('varchar')
    sitterId!: string;

    @Column('varchar', { default: 'pending' })
    status!: 'pending' | 'accepted' | 'rejected';

    @ManyToOne(() => Listing, (listing) => listing.applications, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'listingId' })
    listing?: Listing;
}
