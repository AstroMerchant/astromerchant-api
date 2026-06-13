import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    merchantId: string,
    data: {
      invoiceId?: string;
      transactionId: string;
      amount: number;
      asset?: string;
      sourceAddress: string;
      destinationAddress: string;
      memo?: string;
    },
  ) {
    if (data.invoiceId) {
      const invoice = await this.prisma.invoice.findFirst({
        where: { id: data.invoiceId, merchantId },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }
    }

    return this.prisma.payment.create({
      data: {
        merchantId,
        invoiceId: data.invoiceId || null,
        transactionId: data.transactionId,
        amount: data.amount,
        asset: data.asset || 'XLM',
        status: 'PENDING',
        sourceAddress: data.sourceAddress,
        destinationAddress: data.destinationAddress,
        memo: data.memo || null,
      },
      include: {
        invoice: true,
      },
    });
  }

  async findAll(merchantId: string, status?: string, page = 1, limit = 20) {
    const where: Record<string, unknown> = { merchantId };

    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { invoice: true },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(merchantId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, merchantId },
      include: { invoice: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async updateStatus(merchantId: string, id: string, status: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, merchantId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const validStatuses = ['PENDING', 'COMPLETED', 'FAILED'];

    if (!validStatuses.includes(status)) {
      throw new NotFoundException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updated = await this.prisma.payment.update({
      where: { id },
      data: { status },
      include: { invoice: true },
    });

    if (updated.invoiceId && status === 'COMPLETED') {
      await this.prisma.invoice.update({
        where: { id: updated.invoiceId },
        data: { status: 'PAID' },
      });
    }

    return updated;
  }
}
