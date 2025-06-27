import {
    Body,
    Controller,
    Get,
    Inject,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import type { Application } from '../../domain/applications/application.entity.js';
import type { ApplyDto, UpdateApplicationDto } from './applications.service.js';
import { ApplicationsService } from './applications.service.js';

@Controller()
export class ApplicationsController {
    constructor(
        @Inject(ApplicationsService)
        private readonly applicationsService: ApplicationsService,
    ) {}

    @Post('listings/:id/applications')
    apply(
        @Param('id') id: string,
        @Body() body: { sitterId: string },
    ): Application | undefined {
        const dto: ApplyDto = {
            listingId: parseInt(id, 10),
            sitterId: body.sitterId,
        };
        return this.applicationsService.apply(dto);
    }

    @Patch('applications/:id')
    updateStatus(
        @Param('id') id: string,
        @Body() body: UpdateApplicationDto,
    ): Application | undefined {
        return this.applicationsService.updateStatus(
            parseInt(id, 10),
            body.status,
        );
    }

    @Get('sitters/:sitterId/applications')
    bySitter(@Param('sitterId') sitterId: string): Application[] {
        return this.applicationsService.applicationsBySitter(sitterId);
    }

    @Get('listings/:listingId/applications')
    byListing(@Param('listingId') listingId: string): Application[] {
        return this.applicationsService.applicationsByListing(
            parseInt(listingId, 10),
        );
    }
}
