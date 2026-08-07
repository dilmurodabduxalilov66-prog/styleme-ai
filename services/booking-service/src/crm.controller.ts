import { Controller, Post, Get, Body, Param, Query, UseGuards, Req, ForbiddenException, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BookingService } from './booking.service';
import { RolesGuard } from '../../auth-service/src/roles.guard';
import { Roles } from '../../auth-service/src/roles.decorator';

@Controller('api/v1/barbers/dossiers')
export class CrmController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BARBER', 'OWNER')
  async createDossier(@Req() req: any, @Body() body: any) {
    const barberId = req.user.id;
    const { client_id, face_shape_profile, hair_density, hair_texture, approved_tryon_image_url } = body;
    if (!client_id) {
      throw new BadRequestException('client_id is required');
    }
    const res = await this.bookingService.createDossier(
      barberId,
      client_id,
      face_shape_profile,
      hair_density,
      hair_texture,
      approved_tryon_image_url
    );
    await this.bookingService.writeAuditLog(barberId, 'CREATE_DOSSIER', 'CLIENT_DOSSIER', client_id, body, req.ip);
    return res;
  }

  @Post(':clientId/notes')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BARBER', 'OWNER')
  async addNote(
    @Req() req: any,
    @Param('clientId') clientId: string,
    @Body('note_text') noteText: string,
    @Body('guard_sizes_used') guardSizes: string,
    @Body('haircut_date') haircutDate: string,
  ) {
    const barberId = req.user.id;
    if (!noteText) {
      throw new BadRequestException('note_text is required');
    }
    const res = await this.bookingService.addDossierNote(barberId, clientId, noteText, guardSizes, haircutDate || new Date().toISOString());
    await this.bookingService.writeAuditLog(
      barberId,
      'ADD_DOSSIER_NOTE',
      'CLIENT_DOSSIER',
      clientId,
      { note_text: noteText, guard_sizes_used: guardSizes, haircut_date: haircutDate },
      req.ip
    );
    return res;
  }

  @Get(':clientId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BARBER', 'OWNER', 'USER')
  async getDossier(
    @Req() req: any,
    @Param('clientId') clientId: string,
    @Query('barberId') barberIdQuery?: string,
  ) {
    const actorId = req.user.id;
    const role = req.user.role;

    if (role === 'USER') {
      if (actorId !== clientId) {
        throw new ForbiddenException('You are not allowed to view this dossier.');
      }
      if (!barberIdQuery) {
        throw new BadRequestException('barberId query parameter is required for clients.');
      }
      return this.bookingService.getDossier(barberIdQuery, clientId);
    } else {
      // For BARBER or OWNER
      const barberId = actorId;
      return this.bookingService.getDossier(barberId, clientId);
    }
  }
}
