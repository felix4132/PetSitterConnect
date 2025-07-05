import {
    ArrayNotEmpty,
    ArrayUnique,
    IsArray,
    IsBoolean,
    IsEnum,
    IsISO8601,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import type { Species, ListingType } from '../../../shared/types/index.js';
import {
    SPECIES_VALUES,
    LISTING_TYPE_VALUES,
    VALIDATION_MESSAGES,
} from '../../../shared/types/index.js';

export class CreateListingDto {
    @IsString()
    @IsNotEmpty()
    ownerId!: string;

    @IsString()
    @IsNotEmpty()
    title!: string;

    @IsString()
    @IsNotEmpty()
    description!: string;

    @IsEnum(SPECIES_VALUES, {
        message: VALIDATION_MESSAGES.species,
    })
    species!: Species;

    @IsArray()
    @ArrayNotEmpty()
    @ArrayUnique()
    @IsEnum(LISTING_TYPE_VALUES, {
        each: true,
        message: VALIDATION_MESSAGES.listingType,
    })
    listingType!: ListingType[];

    @IsISO8601()
    startDate!: string;

    @IsISO8601()
    endDate!: string;

    @IsBoolean()
    sitterVerified!: boolean;

    @IsNumber()
    @Min(0)
    price!: number;

    @IsString()
    @IsOptional()
    breed?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    age?: number;

    @IsString()
    @IsOptional()
    size?: string;

    @IsString()
    @IsOptional()
    feeding?: string;

    @IsString()
    @IsOptional()
    medication?: string;
}
