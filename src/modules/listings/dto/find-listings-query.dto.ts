import { Transform } from 'class-transformer';
import {
    IsBoolean,
    IsIn,
    IsISO8601,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import { BaseTransformDto } from '../../../shared/dto/base.dto.js';
import type { Species, ListingType } from '../../../shared/types/index.js';
import {
    SPECIES_VALUES,
    LISTING_TYPE_VALUES,
    VALIDATION_MESSAGES,
} from '../../../shared/types/index.js';

export class FindListingsQueryDto extends BaseTransformDto {
    @IsOptional()
    @Transform(({ value }) => FindListingsQueryDto.transformToNumber(value))
    @IsNumber()
    @Min(1)
    id?: number;

    @IsOptional()
    @IsString()
    ownerId?: string;

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsIn(SPECIES_VALUES, {
        message: VALIDATION_MESSAGES.species,
    })
    species?: Species;

    @IsOptional()
    @IsString({ each: true })
    @IsIn(LISTING_TYPE_VALUES, {
        each: true,
        message: VALIDATION_MESSAGES.listingType,
    })
    listingType?: ListingType[];

    @IsOptional()
    @IsISO8601()
    startDate?: string;

    @IsOptional()
    @IsISO8601()
    endDate?: string;

    @IsOptional()
    @Transform(({ value }) => FindListingsQueryDto.transformToBoolean(value))
    @IsBoolean()
    sitterVerified?: boolean;

    @IsOptional()
    @Transform(({ value }) => FindListingsQueryDto.transformToFloat(value))
    @IsNumber()
    @Min(0)
    price?: number;

    @IsOptional()
    @IsString()
    breed?: string;

    @IsOptional()
    @Transform(({ value }) => FindListingsQueryDto.transformToNumber(value))
    @IsNumber()
    @Min(0)
    age?: number;

    @IsOptional()
    @IsString()
    size?: string;

    @IsOptional()
    @IsString()
    feeding?: string;

    @IsOptional()
    @IsString()
    medication?: string;
}
