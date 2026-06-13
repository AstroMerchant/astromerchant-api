import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(merchantId: string, dto: CreateInvoiceDto) {
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
    });

    let nextNumber = 1001;

    if (lastInvoice) {
      const lastNum = parseInt(lastInvoice.invoiceNumber.replace('INV-', ''), 10);
      nextNumber = lastNum + 1;
    }

    const invoiceNumber = `INV-${nextNumber}`;

    return this.prisma.invoice.create({
      data: {
        merchantId,
        invoiceNumber,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        amount: dto.amount,
        asset: dto.asset || 'XLM',
        status: 'PENDING',
        dueDate: new Date(dto.dueDate),
        description: dto.description || null,
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
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { payments: true } } },
      }),
      this.prisma.invoice.count({ where }),
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
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, merchantId },
      include: { payments: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async updateStatus(merchantId: string, id: string, status: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, merchantId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const validStatuses = ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'];

    if (!validStatuses.includes(status)) {
      throw new NotFoundException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    return this.prisma.invoice.update({
      where: { id },
      data: { status },
    });
  }
}
