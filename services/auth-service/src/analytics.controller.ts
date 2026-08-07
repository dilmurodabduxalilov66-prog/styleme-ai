import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  // We can add @UseGuards(RolesGuard) and @Roles('OWNER', 'ADMIN') later if JwtAuthGuard is added.
  // For now, these are open for the internal network or frontend to proxy
  async getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('growth')
  async getGrowth() {
    return this.analyticsService.getGrowth();
  }

  @Get('growth/chart')
  async getGrowthChart() {
    return this.analyticsService.getGrowthChart();
  }

  @Get('telemetry')
  async getTelemetry() {
    return this.analyticsService.getTelemetry();
  }

  @Get('full')
  async getFullAnalytics() {
    return this.analyticsService.getFullAnalytics();
  }
}
