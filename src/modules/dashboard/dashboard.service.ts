import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable } from '@nestjs/common'
import { DashboardOverviewDto } from './dto/dashboard-overview.dto'

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) { }

  async getOverview(): Promise<DashboardOverviewDto> {
    const [
      totalOrders,
      completedOrders,
      pendingOrders,
      revenueAgg,
      recentTransaction,
    ] = await Promise.all([
      this.prisma.transaction.count(),
      this.prisma.transaction.count({ where: { status: 'PAID' } }),
      this.prisma.transaction.count({ where: { status: 'PENDING' } }),
      this.prisma.transaction.aggregate({
        _sum: { total: true },
        where: { status: 'PAID' },
      }),
      this.prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
    ])

    // ===============================
    // PAYMENT BREAKDOWN (JOIN PAYMENT)
    // ===============================
    const paymentBreakdown = await this.prisma.$queryRaw<
      { method: string; total: bigint }[]
    >`
      SELECT 
        p.method as method,
        SUM(t.total) as total
      FROM "Transaction" t
      JOIN "Payment" p ON p.id = t."paymentId"
      WHERE 
        t.status = 'PAID'
        AND t."paymentId" IS NOT NULL
      GROUP BY p.method
    `

    // ===============================
    // REVENUE CHART (LAST 7 DAYS)
    // ===============================
    const revenueChart = await this.prisma.$queryRaw<
      { date: string; total: bigint }[]
    >`
      SELECT 
        DATE(t."createdAt") as date,
        SUM(t.total) as total
      FROM "Transaction" t
      WHERE t.status = 'PAID'
      GROUP BY DATE(t."createdAt")
      ORDER BY date DESC
      LIMIT 7
    `

    // ===============================
    // TOP PRODUCTS
    // ===============================
    const topProducts = await this.prisma.$queryRaw<
      {
        productId: string
        name: string
        qty: number
        revenue: number
      }[]
    >`
SELECT 
  p.id as "productId",
  p.name,
  SUM(ti.quantity)::int as "qty",
  SUM(ti.quantity * ti.price)::int as "revenue"
FROM "TransactionItem" ti
JOIN "Transaction" t ON t.id = ti."transactionId"
JOIN "Product" p ON p.id = ti."productId"
WHERE t.status = 'PAID'
GROUP BY p.id, p.name
ORDER BY "qty" DESC
LIMIT 5
`

    return {
      stats: {
        totalOrders,
        completedOrders,
        pendingOrders,
        totalRevenue: revenueAgg._sum.total ?? 0,
      },
      paymentBreakdown: paymentBreakdown.map(p => ({
        method: p.method,
        total: Number(p.total),
      })),
      revenueChart: revenueChart.map(r => ({
        date: r.date,
        total: Number(r.total),
      })),
      topProducts: topProducts.map(p => ({
        productId: p.productId,
        name: p.name,
        qty: Number(p.qty),
        revenue: Number(p.revenue),
      })),
      recentTransaction,
    }
  }
}