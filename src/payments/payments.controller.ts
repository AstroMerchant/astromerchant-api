import { Controller, Get, Post, Put, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  create(
    @CurrentUser('id') merchantId: string,
    @Body() body: {
      invoiceId?: string;
      transactionId: string;
      amount: number;
      asset?: string;
      sourceAddress: string;
      destinationAddress: string;
      memo?: string;
    },
  ) {
    return this.paymentsService.create(merchantId, body);
  }

  @Get()
  findAll(
    @CurrentUser('id') merchantId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentsService.findAll(
      merchantId,
      status,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Get(':id')
  findOne(@CurrentUser('id') merchantId: string, @Param('id') id: string) {
    return this.paymentsService.findOne(merchantId, id);
  }

  @Put(':id/status')
  updateStatus(
    @CurrentUser('id') merchantId: string,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.paymentsService.updateStatus(merchantId, id, body.status);
  }
}
