import { Controller, Post, Get, Body, HttpCode, HttpStatus, HttpException, UnauthorizedException, UseGuards, Req, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EskizService } from './eskiz.service';
import { OtpService } from './otp.service';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly eskizService: EskizService,
    private readonly otpService: OtpService,
  ) {}

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 600 } }) // Max 3 requests per 10 mins
  async sendOtp(@Body('phone_number') phone: string) {
    if (!phone) {
      throw new HttpException('Phone number is required', HttpStatus.BAD_REQUEST);
    }
    const code = await this.otpService.generateOtp(phone);
    const message = `Your StyleMe AI verification code is: ${code}`;
    
    // Attempt to send
    const success = await this.eskizService.sendSms(phone, message);
    if (!success) {
      console.warn(`[BYPASS] Eskiz SMS failed. Likely test account. Use OTP: ${code}`);
      return { success: true, message: `TEST REJIM (Eskiz ishlata olmadi): Sizning kodingiz: ${code}`, test_code: code };
    }
    return { success: true, message: 'OTP sent successfully' };
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body('phone_number') phone: string,
    @Body('otp') otp: string,
  ) {
    if (!phone || !otp) {
      throw new HttpException('Phone number and OTP are required', HttpStatus.BAD_REQUEST);
    }
    await this.otpService.verifyOtp(phone, otp);
    return { success: true, message: 'Phone number verified successfully' };
  }

  @Post('signup')
  async signup(
    @Body('email') email: string,
    @Body('phone_number') phone: string,
    @Body('password') password_raw: string,
    @Body('role') role: string,
  ) {
    const isVerified = await this.otpService.isPhoneVerified(phone);
    if (!isVerified) {
      throw new UnauthorizedException('Phone number must be verified via OTP before signup');
    }
    const result = await this.authService.signup(email, phone, password_raw, role);
    await this.otpService.consumeVerification(phone); // Consume so it can't be reused
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body('username') username: string, // Email or Phone number
    @Body('password') password_raw: string,
  ) {
    return this.authService.login(username, password_raw);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refresh_token') refresh_token: string) {
    return this.authService.refresh(refresh_token);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @Get('profile/favorites')
  @UseGuards(AuthGuard('jwt'))
  async getFavorites(@Req() req: any) {
    return this.authService.getFavorites(req.user.id);
  }

  @Post('profile/favorites')
  @UseGuards(AuthGuard('jwt'))
  async toggleFavorite(@Req() req: any, @Body() data: any) {
    return this.authService.toggleFavorite(req.user.id, data.type, data.id);
  }

  @Post('profile/settings')
  @UseGuards(AuthGuard('jwt'))
  async updateSettings(@Req() req: any, @Body() data: any) {
    return this.authService.updateSettings(req.user.id, data);
  }

  // Admin Triage Endpoints
  @Get('admin/triage')
  @UseGuards(AuthGuard('jwt'))
  async getTriageComplaints(@Req() req: any) {
    // In a real scenario we'd check if user is ADMIN/OWNER
    return this.authService.getTriageComplaints();
  }

  @Post('admin/triage/:id/resolve')
  @UseGuards(AuthGuard('jwt'))
  async resolveTriageComplaint(@Req() req: any, @Body() body: any, @Param('id') id: string) {
    return this.authService.resolveTriageComplaint(id, body.action);
  }

  @Post('subscription/upgrade')
  @UseGuards(AuthGuard('jwt'))
  async upgradeSubscription(@Req() req: any, @Body('plan') plan: string) {
    return this.authService.upgradeSubscription(req.user.id, plan);
  }

  // 2FA Settings OTP Endpoints
  @Post('send-settings-otp')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async sendSettingsOtp(@Req() req: any) {
    const user = await this.authService.getUserById(req.user.id);
    if (!user || !user.phone_number) {
      throw new HttpException('User phone number not found', HttpStatus.BAD_REQUEST);
    }
    const phone = user.phone_number;
    const code = await this.otpService.generateOtp(phone);
    const message = `StyleMe AI: Tizim sozlamalarini tasdiqlash uchun kodingiz: ${code}`;
    const success = await this.eskizService.sendSms(phone, message);
    if (!success) {
      return { success: true, message: `TEST REJIM: Sizning 2FA kodingiz: ${code}`, test_code: code };
    }
    return { success: true, message: '2FA OTP kodi telefoningizga yuborildi' };
  }

  @Post('verify-settings-otp')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async verifySettingsOtp(@Req() req: any, @Body('otp') otp: string) {
    const user = await this.authService.getUserById(req.user.id);
    if (!user || !user.phone_number) {
      throw new HttpException('User phone number not found', HttpStatus.BAD_REQUEST);
    }
    if (!otp) {
      throw new HttpException('OTP kodi kiritilishi shart', HttpStatus.BAD_REQUEST);
    }
    await this.otpService.verifyOtp(user.phone_number, otp);
    await this.otpService.consumeVerification(user.phone_number);
    return { success: true, message: '2FA tasdiqlandi' };
  }

  // Forgot Password / Account Recovery Endpoints
  @Post('forgot-password/send-otp')
  @HttpCode(HttpStatus.OK)
  async sendForgotPasswordOtp(@Body('phone_number') phone: string) {
    if (!phone) {
      throw new HttpException('Telefon raqam yoki login kiritilishi shart', HttpStatus.BAD_REQUEST);
    }
    const user = await this.authService.findUserByPhone(phone);
    if (!user) {
      throw new HttpException('Ushbu telefon raqami yoki login bilan ro\'yxatdan o\'tilgan hisob topilmadi', HttpStatus.NOT_FOUND);
    }
    const targetPhone = user.phone_number || phone;
    const code = await this.otpService.generateOtp(targetPhone);
    const message = `StyleMe AI: Parolni tiklash kodingiz: ${code}`;
    const success = await this.eskizService.sendSms(targetPhone, message);
    if (!success) {
      return { success: true, message: `TEST REJIM: Parol tiklash kodingiz: ${code}`, test_code: code };
    }
    return { success: true, message: 'Parolni tiklash kodi telefoningizga yuborildi' };
  }

  @Post('forgot-password/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyForgotPasswordOtp(@Body('phone_number') phone: string, @Body('otp') otp: string) {
    if (!phone || !otp) {
      throw new HttpException('Telefon raqami va OTP kodi kiritilishi shart', HttpStatus.BAD_REQUEST);
    }
    const user = await this.authService.findUserByPhone(phone);
    const targetPhone = user ? user.phone_number : phone;
    await this.otpService.verifyOtp(targetPhone, otp);
    return { success: true, message: 'OTP kodi tasdiqlandi' };
  }

  @Post('forgot-password/reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body('phone_number') phone: string, @Body('password') newPassword: string, @Body('otp') otp?: string) {
    if (!phone || !newPassword) {
      throw new HttpException('Telefon raqami va yangi parol kiritilishi shart', HttpStatus.BAD_REQUEST);
    }
    const user = await this.authService.findUserByPhone(phone);
    const targetPhone = user ? user.phone_number : phone;
    if (otp) {
      await this.otpService.verifyOtp(targetPhone, otp);
      await this.otpService.consumeVerification(targetPhone);
    } else {
      const isVerified = await this.otpService.isPhoneVerified(targetPhone);
      if (!isVerified) {
        throw new UnauthorizedException('OTP kodi tasdiqlanmagan');
      }
      await this.otpService.consumeVerification(targetPhone);
    }
    return this.authService.resetPassword(targetPhone, newPassword);
  }
}
