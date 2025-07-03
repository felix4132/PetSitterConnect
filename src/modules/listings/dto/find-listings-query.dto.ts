import { Transform } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsISO8601,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class FindListingsQueryDto {
    @IsOptional()
    @Transform(({ value }: { value: string }) => {
        if (typeof value !== 'string') return value;
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? value : parsed; // Lass Validierung den Fehler handhaben
    })
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
    @IsEnum(['dog', 'cat', 'bird', 'exotic', 'other'], {
        message: 'species must be one of: dog, cat, bird, exotic, other',
    })
    species?: 'dog' | 'cat' | 'bird' | 'exotic' | 'other';

    @IsOptional()
    @IsEnum(
        [
            'house-sitting',
            'drop-in-visit',
            'day-care',
            'walks',
            'feeding',
            'overnight',
        ],
        {
            each: true,
            message:
                'each listingType must be one of: house-sitting, drop-in-visit, day-care, walks, feeding, overnight',
        },
    )
    listingType?: Array<
        | 'house-sitting'
        | 'drop-in-visit'
        | 'day-care'
        | 'walks'
        | 'feeding'
        | 'overnight'
    >;

    @IsOptional()
    @IsISO8601()
    startDate?: string;

    @IsOptional()
    @IsISO8601()
    endDate?: string;

    @IsOptional()
    @Transform(({ value }: { value: string }) => value === 'true')
    @IsBoolean()
    sitterVerified?: boolean;

    @IsOptional()
    @Transform(({ value }: { value: string }) => {
        if (typeof value !== 'string') return value;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? value : parsed; // Lass Validierung den Fehler handhaben
    })
    @IsNumber()
    @Min(0)
    price?: number;

    @IsOptional()
    @IsString()
    breed?: string;

    @IsOptional()
    @Transform(({ value }: { value: string }) => {
        if (typeof value !== 'string') return value;
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? value : parsed; // Lass Validierung den Fehler handhaben
    })
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
