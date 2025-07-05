import { Transform } from 'class-transformer';
import { IsNumber, IsString, IsNotEmpty, Min } from 'class-validator';

/**
 * Base DTO for ID-based parameters
 */
export abstract class IdParamsDto {
    @IsNumber()
    @Min(1)
    @Transform(({ value }) => parseInt(value as string, 10))
    id!: number;
}

/**
 * Base DTO for string ID parameters
 */
export abstract class StringIdParamsDto {
    @IsString()
    @IsNotEmpty()
    id!: string;
}

/**
 * Base DTO for transformation utilities
 */
export abstract class BaseTransformDto {
    /**
     * Transform string to number with fallback for validation
     */
    protected static transformToNumber(value: unknown): unknown {
        if (typeof value !== 'string') return value;
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? value : parsed;
    }

    /**
     * Transform string to float with fallback for validation
     */
    protected static transformToFloat(value: unknown): unknown {
        if (typeof value !== 'string') return value;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? value : parsed;
    }

    /**
     * Transform string to boolean
     */
    protected static transformToBoolean(value: unknown): unknown {
        if (typeof value === 'string') {
            return value === 'true';
        }
        return value;
    }
}
