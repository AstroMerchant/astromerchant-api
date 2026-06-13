import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as uuid from 'uuid';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async create(merchantId: string, name: string, expiresInDays?: number) {
    const rawKey = `am_${uuid.v4().replace(/-/g, '')}`;
    const prefix = rawKey.slice(0, 8);

    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    await this.prisma.apiKey.create({
      data: {
        merchantId,
        name,
        key: hashedKey,
        prefix,
        expiresAt,
      },
    });

    return {
      name,
      prefix,
      key: rawKey,
      expiresAt,
      message: 'Save this API key securely. It will not be shown again.',
    };
  }

  async findAll(merchantId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { merchantId },
      select: {
        id: true,
        name: true,
        prefix: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return keys;
  }

  async remove(merchantId: string, id: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id, merchantId },
    });

    if (!key) {
      throw new NotFoundException('API key not found');
    }

    await this.prisma.apiKey.delete({ where: { id } });
    return { message: 'API key deleted successfully' };
  }

  async validate(key: string): Promise<boolean> {
    const hashedKey = crypto.createHash('sha256').update(key).digest('hex');

    const apiKey = await this.prisma.apiKey.findUnique({
      where: { key: hashedKey },
    });

    if (!apiKey || !apiKey.isActive) {
      return false;
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return false;
    }

    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return true;
  }
}
