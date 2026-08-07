import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BookingService } from './booking.service';
import { RolesGuard } from '../../auth-service/src/roles.guard';
import { Roles } from '../../auth-service/src/roles.decorator';

@Controller('api/v1/barbers/availability')
export class AvailabilityController {
  constructor(private readonly bookingService: BookingService) {}

  @Put('schedule')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BARBER', 'OWNER')
  async updateSchedule(@Req() req: any, @Body('work_hours') workHours: any) {
    const barberId = req.user.id;
    const res = await this.bookingService.updateWeeklySchedule(barberId, workHours);
    await this.bookingService.writeAuditLog(barberId, 'UPDATE_SCHEDULE', 'BARBER_PROFILE', barberId, workHours, req.ip);
    return res;
  }

  @Get('schedule')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BARBER', 'OWNER')
  async getSchedule(@Req() req: any) {
    return this.bookingService.getWeeklySchedule(req.user.id);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BARBER', 'OWNER')
  async getProfile(@Req() req: any) {
    return this.bookingService.getBarberProfileInfo(req.user.id);
  }

  @Put('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BARBER', 'OWNER')
  async updateProfile(@Req() req: any, @Body() data: any) {
    const barberId = req.user.id;
    const res = await this.bookingService.updateBarberProfileInfo(barberId, data);
    await this.bookingService.writeAuditLog(barberId, 'UPDATE_PROFILE', 'BARBER_PROFILE', barberId, data, req.ip);
    return res;
  }

  @Post('verify')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BARBER', 'OWNER')
  async submitVerification(@Req() req: any, @Body('document_url') documentUrl: string) {
    const barberId = req.user.id;
    const res = await this.bookingService.submitVerification(barberId, documentUrl);
    await this.bookingService.writeAuditLog(barberId, 'SUBMIT_VERIFICATION', 'BARBER_PROFILE', barberId, { documentUrl }, req.ip);
    return res;
  }

  @Post('holidays')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BARBER', 'OWNER')
  async addHoliday(@Req() req: any, @Body('holiday_date') holidayDate: string, @Body('reason') reason: string) {
    const barberId = req.user.id;
    const res = await this.bookingService.addHoliday(barberId, holidayDate, reason);
    await this.bookingService.writeAuditLog(barberId, 'ADD_HOLIDAY', 'BARBER_HOLIDAY', barberId, { holidayDate, reason }, req.ip);
    return res;
  }

  @Get('holidays')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BARBER', 'OWNER')
  async getHolidays(@Req() req: any) {
    return this.bookingService.getHolidays(req.user.id);
  }

  @Delete('holidays/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BARBER', 'OWNER')
  async removeHoliday(@Req() req: any, @Param('id') holidayId: string) {
    const barberId = req.user.id;
    const res = await this.bookingService.deleteHoliday(barberId, holidayId);
    await this.bookingService.writeAuditLog(barberId, 'DELETE_HOLIDAY', 'BARBER_HOLIDAY', barberId, { holidayId }, req.ip);
    return res;
  }

  @Get(':barberId/slots')
  async querySlots(@Param('barberId') barberId: string, @Query('date') date: string) {
    return this.bookingService.queryAvailableSlots(barberId, date);
  }
}
