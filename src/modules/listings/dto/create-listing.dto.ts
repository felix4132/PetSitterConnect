import {
    ArrayNotEmpty,
    ArrayUnique,
    IsArray,
    IsBoolean,
    IsIn,
    IsISO8601,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import type { ListingType, Species } from '../../../shared/types/types.js';
import {
    LISTING_TYPE_VALUES,
    SPECIES_VALUES,
    VALIDATION_MESSAGES,
} from '../../../shared/types/types.js';

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

    @IsIn(SPECIES_VALUES, {
        message: VALIDATION_MESSAGES.species,
    })
    species!: Species;

    @IsArray()
    @ArrayNotEmpty()
    @ArrayUnique()
    @IsString({ each: true })
    @IsIn(LISTING_TYPE_VALUES, {
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
