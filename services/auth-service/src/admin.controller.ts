import { Controller, Get, Delete, Param, Post, Body, Req } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('api/v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('settings')
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Post('settings')
  async updateSettings(
    @Body('baseCommission') baseCommission: number,
    @Body('sRankCommission') sRankCommission: number,
    @Body('lockoutThreshold') lockoutThreshold: number
  ) {
    return this.adminService.updateSettings(baseCommission, sRankCommission, lockoutThreshold);
  }

  @Get('users')
  async getAdmins() {
    return this.adminService.getAdmins();
  }
  @Post('users')
  async createAdmin(
    @Body('first_name') firstName: string,
    @Body('email') email: string,
    @Body('password') passwordRaw: string,
  ) {
    return this.adminService.createAdmin(firstName, email, passwordRaw);
  }

  @Delete('users/:id/role')
  async revokeAdmin(@Param('id') id: string) {
    return this.adminService.revokeAdmin(id);
  }

  @Get('barbers')
  async getBarbers() {
    return this.adminService.getBarbers();
  }

  @Post('barbers')
  async createBarber(
    @Body('first_name') firstName: string,
    @Body('email') email: string,
    @Body('password') passwordRaw: string,
  ) {
    return this.adminService.createBarber(firstName, email, passwordRaw);
  }

  @Delete('barbers/:id/role')
  async revokeBarber(@Param('id') id: string) {
    return this.adminService.revokeBarber(id);
  }

  @Get('moderate')
  async getModerate() {
    return this.adminService.getModerate();
  }

  @Get('triage')
  async getTriage() {
    return this.adminService.getTriage();
  }

  @Get('verify')
  async getVerify() {
    return this.adminService.getVerify();
  }

  @Post('verify/:id/decision')
  async verifyDecision(@Param('id') id: string, @Body('decision') decision: string, @Body('reason') reason: string, @Req() req: any) {
    const adminId = req.user ? req.user.id : null;
    return this.adminService.verifyDecision(id, decision, reason, adminId);
  }

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @Post('moderate/:id/decision')
  async moderateDecision(@Param('id') id: string, @Body('action') action: string) {
    return this.adminService.moderateDecision(id, action);
  }

  @Post('triage/:id/resolve')
  async resolveTriage(@Param('id') id: string, @Body('action') action: string) {
    return this.adminService.resolveTriage(id, action);
  }
}
