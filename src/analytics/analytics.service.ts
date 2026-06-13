import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(merchantId: string) {
    const [
      totalRevenue,
      completedPayments,
      totalPayments,
      pendingPayments,
      invoiceStats,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { merchantId, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.payment.count({
        where: { merchantId, status: 'COMPLETED' },
      }),
      this.prisma.payment.count({
        where: { merchantId },
      }),
      this.prisma.payment.count({
        where: { merchantId, status: 'PENDING' },
      }),
      this.prisma.invoice.aggregate({
        where: { merchantId },
        _count: true,
      }),
    ]);

    const successRate =
      totalPayments > 0
        ? Math.round((completedPayments / totalPayments) * 10000) / 100
        : 0;

    return {
      totalRevenue: totalRevenue._sum.amount || 0,
      totalTransactions: totalPayments,
      completedTransactions: completedPayments,
      pendingTransactions: pendingPayments,
      successRate,
      totalInvoices: invoiceStats._count || 0,
    };
  }

  async getRevenue(merchantId: string, from?: string, to?: string, groupBy = 'day') {
    const where: Record<string, unknown> = {
      merchantId,
      status: 'COMPLETED',
    };

    if (from || to) {
      const createdAt: Record<string, Date> = {};

      if (from) {
        createdAt.gte = new Date(from);
      }

      if (to) {
        createdAt.lte = new Date(to);
      }

      where.createdAt = createdAt;
    }

    const payments = await this.prisma.payment.findMany({
      where,
      select: {
        amount: true,
        asset: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (groupBy === 'day') {
      const grouped: Record<string, { amount: number; count: number }> = {};

      for (const p of payments) {
        const key = p.createdAt.toISOString().slice(0, 10);

        if (!grouped[key]) {
          grouped[key] = { amount: 0, count: 0 };
        }

        grouped[key].amount += p.amount;
        grouped[key].count += 1;
      }

      return {
        groupBy: 'day',
        data: Object.entries(grouped).map(([date, values]) => ({
          date,
          revenue: values.amount,
          transactions: values.count,
        })),
      };
    }

    if (groupBy === 'month') {
      const grouped: Record<string, { amount: number; count: number }> = {};

      for (const p of payments) {
        const d = p.createdAt;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

        if (!grouped[key]) {
          grouped[key] = { amount: 0, count: 0 };
        }

        grouped[key].amount += p.amount;
        grouped[key].count += 1;
      }

      return {
        groupBy: 'month',
        data: Object.entries(grouped).map(([month, values]) => ({
          month,
          revenue: values.amount,
          transactions: values.count,
        })),
      };
    }

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      groupBy: 'total',
      data: {
        totalRevenue,
        totalTransactions: payments.length,
      },
    };
  }
}
