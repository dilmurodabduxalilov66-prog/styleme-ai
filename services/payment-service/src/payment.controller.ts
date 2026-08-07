import { Controller, Post, Body, Headers, HttpCode, HttpStatus, UnauthorizedException, BadRequestException, InternalServerErrorException, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { PaymentService } from './payment.service';

@Controller('api/v1/payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // ==========================================================================
  // Generate Checkout URLs
  // ==========================================================================
  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  async generateCheckoutUrl(
    @Body('booking_id') bookingId: string,
    @Body('provider') provider: string,
  ) {
    if (!bookingId) {
      throw new BadRequestException('booking_id is required');
    }
    const amount = 50000;

    if (provider === 'CLICK') {
      const merchantId = process.env.CLICK_MERCHANT_ID;
      const serviceId = process.env.CLICK_SERVICE_ID;
      if (!merchantId || !serviceId) throw new InternalServerErrorException('CLICK gateway not configured');
      await this.paymentService.logCheckoutAttempt(bookingId, 'CLICK', amount);
      return { 
        url: `https://my.click.uz/services/pay?service_id=${serviceId}&merchant_id=${merchantId}&amount=${amount}&transaction_param=${bookingId}`
      };
    } else if (provider === 'PAYME') {
      const merchantId = process.env.PAYME_MERCHANT_ID;
      if (!merchantId) throw new InternalServerErrorException('PAYME gateway not configured');
      await this.paymentService.logCheckoutAttempt(bookingId, 'PAYME', amount);
      const str = `m=${merchantId};ac.booking_id=${bookingId};a=${amount * 100}`;
      const base64 = Buffer.from(str).toString('base64');
      return { url: `https://checkout.paycom.uz/${base64}` };
    } else {
      throw new BadRequestException('Unsupported payment provider');
    }
  }

  // ==========================================================================
  // Get Ledger (Barber Financial Stats)
  // ==========================================================================
  @Get('ledger')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BARBER', 'OWNER')
  async getLedger(@Req() req: any) {
    const barberId = req.user.id;
    return this.paymentService.getLedger(barberId);
  }

  // ==========================================================================
  // Webhooks
  // ==========================================================================
  @Post('webhooks/click')
  @HttpCode(HttpStatus.OK)
  async handleClickWebhook(
    @Body('click_trans_id') clickTransId: number,
    @Body('service_id') serviceId: number,
    @Body('click_paydoc_id') clickPaydocId: number,
    @Body('merchant_trans_id') merchantTransId: string,
    @Body('amount') amount: number,
    @Body('action') action: number,
    @Body('error') error: number,
    @Body('sign_time') signTime: string,
    @Body('sign_string') signString: string,
  ) {
    const isValid = this.paymentService.verifyClickSignature(
      clickTransId, serviceId, merchantTransId, amount, action, error, signTime, signString,
    );

    if (!isValid) {
      await this.paymentService.markPaymentAsFailed(merchantTransId, 'CLICK', clickTransId.toString(), 'Invalid Signature');
      throw new UnauthorizedException('Invalid CLICK signature string');
    }

    if (error !== 0) {
      await this.paymentService.markPaymentAsFailed(merchantTransId, 'CLICK', clickTransId.toString(), `Gateway Error: ${error}`);
      return { error: error, error_note: 'Transaction failed from gateway.' };
    }

    if (action === 0) {
      // Prepare action
      return { click_trans_id: clickTransId, merchant_trans_id: merchantTransId, merchant_prepare_id: clickTransId, error: 0, error_note: 'Success' };
    }

    if (action === 1) {
      // Complete action
      await this.paymentService.settleDigitalPayment(merchantTransId, 'CLICK', clickTransId.toString(), amount);
      return { click_trans_id: clickTransId, merchant_trans_id: merchantTransId, merchant_confirm_id: clickTransId, error: 0, error_note: 'Success' };
    }

    // Handle refunds
    if (action === 2) { // Cancel action
       await this.paymentService.processRefund(merchantTransId);
       return { click_trans_id: clickTransId, merchant_trans_id: merchantTransId, error: 0, error_note: 'Refunded' };
    }

    return { error: 0, error_note: 'Request received.' };
  }

  @Post('webhooks/payme')
  @HttpCode(HttpStatus.OK)
  async handlePaymeWebhook(
    @Headers('Authorization') authHeader: string,
    @Body() payload: any,
  ) {
    const isAuthorized = this.paymentService.verifyPaymeAuth(authHeader);
    if (!isAuthorized) throw new UnauthorizedException('Invalid Payme basic authentication');

    const method = payload.method;
    const params = payload.params;
    
    if (method === 'CheckPerformTransaction') {
      return { jsonrpc: '2.0', result: { allow: true }, id: payload.id };
    }

    if (method === 'PerformTransaction') {
      const bookingId = params.account.booking_id;
      const transactionId = params.id;
      const amount = params.amount / 100;
      await this.paymentService.settleDigitalPayment(bookingId, 'PAYME', transactionId, amount);

      return { jsonrpc: '2.0', result: { transaction: transactionId, perform_time: Date.now(), state: 2 }, id: payload.id };
    }

    if (method === 'CancelTransaction') {
      const bookingId = params.account?.booking_id || 'unknown';
      if (bookingId !== 'unknown') {
         await this.paymentService.processRefund(bookingId);
      }
      return { jsonrpc: '2.0', result: { transaction: params.id, cancel_time: Date.now(), state: -2 }, id: payload.id };
    }
    
    if (method === 'CheckTransaction') {
       return { jsonrpc: '2.0', result: { create_time: Date.now(), perform_time: Date.now(), cancel_time: 0, transaction: params.id, state: 2, reason: null }, id: payload.id };
    }

    throw new BadRequestException('Unsupported JSON-RPC method.');
  }
}
