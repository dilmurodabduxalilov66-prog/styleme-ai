import { Controller, Post, Get, Body, Req, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReputationService } from './reputation.service';
import { RolesGuard } from '../../auth-service/src/roles.guard';
import { Roles } from '../../auth-service/src/roles.decorator';

@Controller('api/v1/reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Get('status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BARBER', 'OWNER')
  async getStatus(@Req() req: any) {
    const barberId = req.user.id;
    return this.reputationService.getBarberReputation(barberId);
  }

  @Post('recalculate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BARBER', 'ADMIN', 'OWNER')
  async recalculate(@Req() req: any, @Body('barber_id') barberId?: string) {
    const targetId = (req.user.role === 'BARBER') ? req.user.id : (barberId || req.user.id);
    return this.reputationService.recalculateBarberReputation(targetId);
  }

  @Post('reviews')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('USER')
  async submitReview(
    @Req() req: any,
    @Body() body: { booking_id: number; barber_id: string; rating: number; comment: string }
  ) {
    const userId = req.user.id;
    return this.reputationService.submitReview(userId, body.booking_id, body.barber_id, body.rating, body.comment);
  }
}
