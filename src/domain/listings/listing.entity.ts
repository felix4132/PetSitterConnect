import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Application } from '../applications/application.entity.js';

@Entity('listings')
export class Listing {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('varchar')
    ownerId!: string;

    @Column('varchar')
    title!: string;

    @Column('text')
    description!: string;

    @Column('varchar')
    species!: 'dog' | 'cat' | 'bird' | 'exotic' | 'other';

    @Column('varchar')
    listingType!:
        | 'house-sitting'
        | 'drop-in-visit'
        | 'day-care'
        | 'walks'
        | 'feeding'
        | 'overnight';

    @Column('varchar')
    startDate!: string; // ISO date

    @Column('varchar')
    endDate!: string; // ISO date

    @Column('boolean')
    sitterVerified!: boolean;

    @Column('decimal', { precision: 10, scale: 2 })
    price!: number;

    @Column('varchar', { nullable: true })
    breed?: string;

    @Column('integer', { nullable: true })
    age?: number;

    @Column('varchar', { nullable: true })
    size?: string;

    @Column('varchar', { nullable: true })
    feeding?: string;

    @Column('varchar', { nullable: true })
    medication?: string;

    @OneToMany(() => Application, (application) => application.listing, {
        cascade: true,
    })
    applications?: Application[];
}
