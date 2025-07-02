import {
    IsBoolean,
    IsEnum,
    IsISO8601,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

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

    @IsEnum(['dog', 'cat', 'bird', 'exotic', 'other'])
    species!: 'dog' | 'cat' | 'bird' | 'exotic' | 'other';

    @IsEnum([
        'house-sitting',
        'drop-in-visit',
        'day-care',
        'walks',
        'feeding',
        'overnight',
    ])
    listingType!:
        | 'house-sitting'
        | 'drop-in-visit'
        | 'day-care'
        | 'walks'
        | 'feeding'
        | 'overnight';

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
