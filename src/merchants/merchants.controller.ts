import { Controller, Get, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MerchantsService } from './merchants.service';

@ApiTags('merchants')
@Controller('merchants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Get('profile')
  getProfile(@CurrentUser('id') merchantId: string) {
    return this.merchantsService.findById(merchantId);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser('id') merchantId: string,
    @Body() body: { companyName?: string; email?: string },
  ) {
    return this.merchantsService.update(merchantId, body);
  }

  @Delete('profile')
  removeProfile(@CurrentUser('id') merchantId: string) {
    return this.merchantsService.remove(merchantId);
  }
}
