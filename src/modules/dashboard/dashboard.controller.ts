import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { DashboardService } from './dashboard.service'
import { DashboardOverviewDto } from './dto/dashboard-overview.dto'

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('overview')
  @ApiOkResponse({ type: DashboardOverviewDto })
  async overview(): Promise<DashboardOverviewDto> {
    return this.dashboardService.getOverview()
  }
}