import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { IdParamsDto } from '../../../shared/dto/base.dto.js';
import type { ApplicationStatus } from '../../../shared/types/index.js';
import {
    APPLICATION_STATUS_VALUES,
    VALIDATION_MESSAGES,
} from '../../../shared/types/index.js';

export class CreateApplicationDto {
    @IsString()
    @IsNotEmpty()
    sitterId!: string;
}

export class UpdateApplicationDto {
    @IsEnum(APPLICATION_STATUS_VALUES, {
        message: VALIDATION_MESSAGES.applicationStatus,
    })
    @IsNotEmpty()
    status!: ApplicationStatus;
}

export class ApplicationParamsDto extends IdParamsDto {}

export class ListingParamsDto extends IdParamsDto {}

export class SitterParamsDto {
    @IsString()
    @IsNotEmpty()
    sitterId!: string;
}
