import {
    Body,
    Controller,
    Get,
    Inject,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    ValidationPipe,
} from '@nestjs/common';
import type { Application } from '../../domain/applications/application.entity.js';
import { ApplicationsService } from './applications.service.js';
import {
    CreateApplicationDto,
    UpdateApplicationDto,
} from './dto/application.dto.js';

@Controller()
export class ApplicationsController {
    constructor(
        @Inject(ApplicationsService)
        private readonly applicationsService: ApplicationsService,
    ) {}

    @Post('listings/:id/applications')
    async apply(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true }))
        body: CreateApplicationDto,
    ): Promise<Application> {
        return this.applicationsService.apply({
            listingId: id,
            sitterId: body.sitterId,
        });
    }

    @Patch('applications/:id')
    async updateStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true }))
        body: UpdateApplicationDto,
    ): Promise<Application> {
        return this.applicationsService.updateStatus(id, body.status);
    }

    @Get('sitters/:sitterId/applications')
    async bySitter(
        @Param('sitterId') sitterId: string,
    ): Promise<Application[]> {
        return this.applicationsService.applicationsBySitter(sitterId);
    }

    @Get('listings/:listingId/applications')
    async byListing(
        @Param('listingId', ParseIntPipe) listingId: number,
    ): Promise<Application[]> {
        return this.applicationsService.applicationsByListing(listingId);
    }
}
