import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BookingService } from './booking.service';
import { RolesGuard } from '../../auth-service/src/roles.guard';
import { Roles } from '../../auth-service/src/roles.decorator';

@Controller('api/v1/barbers')
export class PortfolioController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('portfolio/upload-url')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BARBER')
  async getUploadUrl(
    @Req() req: any,
    @Query('filename') filename: string,
    @Query('contentType') contentType: string,
  ) {
    const barberId = req.user.id;
    if (!filename) {
      throw new BadRequestException('filename query parameter is required');
    }
    const cleanFilename = encodeURIComponent(filename);
    const mockPreSignedUrl = `https://storage.uzcloud.uz/portfolios/${barberId}/${cleanFilename}?AWSAccessKeyId=mockKey&Signature=mockSig&Expires=9999999999`;
    const fileUrl = `https://storage.uzcloud.uz/portfolios/${barberId}/${cleanFilename}`;

    return {
      upload_url: mockPreSignedUrl,
      file_url: fileUrl,
    };
  }

  @Post('portfolio')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BARBER')
  async commitPortfolioItem(
    @Req() req: any,
    @Body('image_url') imageUrl: string,
    @Body('title') title: string,
    @Body('tags') tags: string[],
  ) {
    const barberId = req.user.id;
    if (!imageUrl) {
      throw new BadRequestException('image_url is required');
    }
    const res = await this.bookingService.commitPortfolioItem(barberId, imageUrl, title || 'Portfolio Cut', tags || []);
    await this.bookingService.writeAuditLog(barberId, 'COMMIT_PORTFOLIO_ITEM', 'BARBER_PORTFOLIO', barberId, { image_url: imageUrl, title, tags }, req.ip);
    return res;
  }

  @Delete('portfolio/:itemId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BARBER')
  async deletePortfolioItem(
    @Req() req: any,
    @Param('itemId') itemId: string,
  ) {
    const barberId = req.user.id;
    const res = await this.bookingService.deletePortfolioItem(barberId, itemId);
    await this.bookingService.writeAuditLog(barberId, 'DELETE_PORTFOLIO_ITEM', 'BARBER_PORTFOLIO', barberId, { itemId }, req.ip);
    return res;
  }

  @Get(':barberId/portfolio')
  async getPortfolio(@Param('barberId') barberId: string) {
    return this.bookingService.getBarberPortfolio(barberId);
  }
}
