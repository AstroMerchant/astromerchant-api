import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@ApiTags('invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('create')
  create(
    @CurrentUser('id') merchantId: string,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoicesService.create(merchantId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('id') merchantId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.invoicesService.findAll(
      merchantId,
      status,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Get(':id')
  findOne(@CurrentUser('id') merchantId: string, @Param('id') id: string) {
    return this.invoicesService.findOne(merchantId, id);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser('id') merchantId: string,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.invoicesService.updateStatus(merchantId, id, body.status);
  }
}
