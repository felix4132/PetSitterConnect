import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import type { ApplicationStatus } from '../../shared/types/types.js';
import { APPLICATION_STATUS_VALUES } from '../../shared/types/types.js';
import { Listing } from '../listings/listing.entity.js';

@Entity('applications')
export class Application {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('integer')
    listingId!: number;

    @Column('varchar')
    sitterId!: string;

    @Column({
        type: 'varchar',
        default: 'pending',
        enum: APPLICATION_STATUS_VALUES,
    })
    status!: ApplicationStatus;

    @ManyToOne(() => Listing, (listing) => listing.applications, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'listingId' })
    listing?: Listing;
}
