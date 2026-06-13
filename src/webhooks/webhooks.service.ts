import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhooksService {
  constructor(private readonly prisma: PrismaService) {}

  async register(merchantId: string, url: string, events: string[]) {
    if (!url || !events || events.length === 0) {
      throw new BadRequestException('URL and at least one event are required');
    }

    const secret = crypto.randomBytes(32).toString('hex');

    return this.prisma.webhook.create({
      data: {
        merchantId,
        url,
        events: JSON.stringify(events),
        isActive: true,
        secret,
      },
    });
  }

  async findAll(merchantId: string) {
    return this.prisma.webhook.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(merchantId: string, id: string) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, merchantId },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    await this.prisma.webhook.delete({ where: { id } });
    return { message: 'Webhook deleted successfully' };
  }

  async test(merchantId: string, id: string) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, merchantId },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    const payload = JSON.stringify({
      event: 'test',
      data: { message: 'This is a test webhook event' },
      timestamp: new Date().toISOString(),
    });

    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(payload)
      .digest('hex');

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': 'test',
        },
        body: payload,
      });

      return {
        success: response.ok,
        statusCode: response.status,
        message: response.ok
          ? 'Test webhook delivered successfully'
          : `Webhook returned status ${response.status}`,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 0,
        message: `Failed to deliver webhook: ${(error as Error).message}`,
      };
    }
  }
}
