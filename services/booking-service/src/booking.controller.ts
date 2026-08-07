import { Controller, Post, Get, Body, Query, UseGuards, Req, HttpStatus, HttpCode, ParseFloatPipe, ParseIntPipe, Param, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BookingService } from './booking.service';
import { RolesGuard } from '../../auth-service/src/roles.guard';
import { Roles } from '../../auth-service/src/roles.decorator';
import { RateLimitGuard } from './rate-limit.guard';

@Controller('api/v1/bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  // ============================================================================
  // Get Nearby Barbers (Public search endpoint)
  // ============================================================================
  @Get('nearby')
  @UseGuards(RateLimitGuard)
  async searchNearby(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius', ParseFloatPipe) radius: number,
    @Query('maxPrice') maxPrice?: string,
    @Query('search') search?: string,
    @Query('rank') rank?: string,
  ) {
    const parsedMaxPrice = maxPrice ? parseFloat(maxPrice) : undefined;
    return this.bookingService.searchBarbersNearby(lat, lng, radius, parsedMaxPrice, search, rank);
  }

  // ============================================================================
  // Create Appointment (Authorized User only)
  // ============================================================================
  @Post('create')
  @UseGuards(AuthGuard('jwt'))
  async createBooking(
    @Req() req: any,
    @Body('barber_id') barberId: string,
    @Body('start_time') startTime: string,
    @Body('end_time') endTime: string,
    @Body('payment_method') paymentMethod: string,
  ) {
    const userId = req.user.id;
    const res = await this.bookingService.createBooking(userId, barberId, startTime, endTime, paymentMethod);
    await this.bookingService.writeAuditLog(userId, 'CREATE_BOOKING', 'BOOKING', res.id, { barber_id: barberId, start_time: startTime, end_time: endTime, payment_method: paymentMethod }, req.ip);
    return res;
  }

  // ============================================================================
  // Complete Appointment (Authorized Barber / Owner only, verified via OTP)
  // ============================================================================
  @Post('complete')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BARBER', 'OWNER')
  async completeBooking(
    @Req() req: any,
    @Body('booking_id') bookingId: string,
    @Body('scheduled_start') scheduledStart: string,
    @Body('otp_code') otpCode?: string,
  ) {
    const barberId = req.user.id;
    const res = await this.bookingService.completeBooking(bookingId, scheduledStart, barberId, otpCode);
    await this.bookingService.writeAuditLog(barberId, 'COMPLETE_BOOKING', 'BOOKING', bookingId, { scheduled_start: scheduledStart, otp_verified: res.verified }, req.ip);
    return res;
  }
  // ============================================================================
  // Get CRM Clients (Authorized Barber / Owner only)
  // ============================================================================
  @Get('crm')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BARBER', 'OWNER')
  async getCrmClients(@Req() req: any) {
    const barberId = req.user.id;
    return this.bookingService.getCrmClients(barberId);
  }

  // ============================================================================
  // Get Today's Bookings (Authorized Barber / Owner only)
  // ============================================================================
  @Get('today')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BARBER', 'OWNER')
  async getTodayBookings(@Req() req: any, @Query('date') dateQuery?: string) {
    const barberId = req.user.id;
    return this.bookingService.getTodayBookings(barberId, dateQuery);
  }

  // ============================================================================
  // Get Booking History (Authorized Barber / Owner only)
  // ============================================================================
  @Get('history')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BARBER', 'OWNER')
  async getHistoryBookings(@Req() req: any) {
    const barberId = req.user.id;
    return this.bookingService.getHistoryBookings(barberId);
  }

  @Get('client/active')
  @UseGuards(AuthGuard('jwt'))
  async getClientActiveBookings(@Req() req: any) {
    const userId = req.user.id;
    return this.bookingService.getClientActiveBookings(userId);
  }

  @Get('client/missed')
  @UseGuards(AuthGuard('jwt'))
  async getClientMissedBookings(@Req() req: any) {
    const userId = req.user.id;
    return this.bookingService.getClientMissedBookings(userId);
  }

  @Get('client/history')
  @UseGuards(AuthGuard('jwt'))
  async getClientHistoryBookings(@Req() req: any) {
    const userId = req.user.id;
    return this.bookingService.getClientHistoryBookings(userId);
  }

  @Post('cancel/:id')
  @UseGuards(AuthGuard('jwt'))
  async cancelBooking(@Req() req: any, @Param('id') bookingId: string) {
    const userId = req.user.id;
    try {
      return await this.bookingService.cancelBooking(userId, bookingId);
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  @Post('refunds/apply')
  @UseGuards(AuthGuard('jwt'))
  async applyForRefund(@Req() req: any, @Body() body: { booking_id: string }) {
    const userId = req.user.id;
    return this.bookingService.applyForRefund(userId, body.booking_id);
  }

  @Get('admin/refunds')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async getRefundRequests() {
    return this.bookingService.getRefundRequests();
  }

  @Post('admin/refunds/:id/approve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async approveRefundRequest(@Param('id') id: string) {
    return this.bookingService.approveRefundRequest(id);
  }
}
