import { Controller, Get } from '@nestjs/common';
import { FatouraService } from '../shared/fatoura.service';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly fatouraService: FatouraService) { }

    @Get()
    getDashboard() {
        return this.fatouraService.getDashboard();
    }
}
