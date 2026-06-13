import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiKeysService } from './api-keys.service';

@ApiTags('api-keys')
@Controller('api-keys')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post('create')
  create(
    @CurrentUser('id') merchantId: string,
    @Body() body: { name: string; expiresInDays?: number },
  ) {
    return this.apiKeysService.create(merchantId, body.name, body.expiresInDays);
  }

  @Get()
  findAll(@CurrentUser('id') merchantId: string) {
    return this.apiKeysService.findAll(merchantId);
  }

  @Delete(':id')
  remove(@CurrentUser('id') merchantId: string, @Param('id') id: string) {
    return this.apiKeysService.remove(merchantId, id);
  }
}
