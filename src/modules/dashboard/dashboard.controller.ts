import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { DashboardService } from './dashboard.service'
import { DashboardOverviewDto } from './dto/dashboard-overview.dto'
import { JwtGuard } from 'src/common/guards/jwt.guard'
import { RolesGuard } from 'src/common/guards/roles.guard'
import { Roles } from 'src/common/decorators/roles.decorator'
import { UserRole } from '@prisma/client'

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('overview')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN && UserRole.STOREOWNER)
  @ApiOkResponse({ type: DashboardOverviewDto })
  async overview(): Promise<DashboardOverviewDto> {
    return this.dashboardService.getOverview()
  }
}
