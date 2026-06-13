import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WebhooksService } from './webhooks.service';

@ApiTags('webhooks')
@Controller('webhooks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('register')
  register(
    @CurrentUser('id') merchantId: string,
    @Body() body: { url: string; events: string[] },
  ) {
    return this.webhooksService.register(merchantId, body.url, body.events);
  }

  @Get()
  findAll(@CurrentUser('id') merchantId: string) {
    return this.webhooksService.findAll(merchantId);
  }

  @Delete(':id')
  remove(@CurrentUser('id') merchantId: string, @Param('id') id: string) {
    return this.webhooksService.remove(merchantId, id);
  }

  @Post(':id/test')
  test(@CurrentUser('id') merchantId: string, @Param('id') id: string) {
    return this.webhooksService.test(merchantId, id);
  }
}
