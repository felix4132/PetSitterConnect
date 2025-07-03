import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateApplicationDto {
    @IsString()
    @IsNotEmpty()
    sitterId!: string;
}

export class UpdateApplicationDto {
    @IsEnum(['pending', 'accepted', 'rejected'], {
        message:
            'status must be one of the following values: pending, accepted, rejected',
    })
    @IsNotEmpty()
    status!: 'pending' | 'accepted' | 'rejected';
}

export class ApplicationParamsDto {
    @IsNumber()
    @Min(1)
    @Transform(({ value }) => parseInt(value as string))
    id!: number;
}

export class ListingParamsDto {
    @IsNumber()
    @Min(1)
    @Transform(({ value }) => parseInt(value as string))
    id!: number;
}

export class SitterParamsDto {
    @IsString()
    @IsNotEmpty()
    sitterId!: string;
}
