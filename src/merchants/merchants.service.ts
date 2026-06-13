import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MerchantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
      include: {
        users: true,
        wallets: true,
        _count: {
          select: {
            invoices: true,
            payments: true,
            transactions: true,
          },
        },
      },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    const { password, ...result } = merchant;
    return result;
  }

  async update(id: string, data: { companyName?: string; email?: string }) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id } });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    const updated = await this.prisma.merchant.update({
      where: { id },
      data,
      include: {
        users: true,
        wallets: true,
      },
    });

    const { password, ...result } = updated;
    return result;
  }

  async remove(id: string) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id } });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    await this.prisma.merchant.delete({ where: { id } });
    return { message: 'Merchant deleted successfully' };
  }
}
