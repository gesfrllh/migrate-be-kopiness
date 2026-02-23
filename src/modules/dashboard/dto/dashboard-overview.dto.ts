import { ApiProperty } from "@nestjs/swagger";

export class DashboardStatsDto {
  @ApiProperty({ example: 120 })
  totalOrders: number

  @ApiProperty({ example: 85000000 })
  totalRevenue: number

  @ApiProperty({ example: 12 })
  pendingOrders: number

  @ApiProperty({ example: 108 })
  completedOrders: number
}

export class RevenueChartDto {
  @ApiProperty({ example: '2026-05-29' })
  date: string

  @ApiProperty({ example: 35000000 })
  total: number
}

export class TopProductDto {
  @ApiProperty({ example: 'prod-uuid-123' })
  productId: string

  @ApiProperty({ example: 'Americano' })
  name: string

  @ApiProperty({ example: 87 })
  qty: number

  @ApiProperty({ example: 1250000 })
  revenue: number
}

export class PaymentBreakdownDto {
  @ApiProperty({ example: 'QRIS' })
  method: string

  @ApiProperty({ example: 42000000 })
  total: number
}

export class RecentTransactionDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  total: number

  @ApiProperty({ example: 'SUCCESS' })
  status: string

  @ApiProperty()
  createdAt: Date
}

export class DashboardOverviewDto {
  @ApiProperty({ type: DashboardStatsDto })
  stats: DashboardStatsDto

  @ApiProperty({ type: [RevenueChartDto] })
  revenueChart: RevenueChartDto[]

  @ApiProperty({ type: [TopProductDto] })
  topProducts: TopProductDto[]

  @ApiProperty({ type: [PaymentBreakdownDto] })
  paymentBreakdown: PaymentBreakdownDto[]

  @ApiProperty({ type: [RecentTransactionDto] })
  recentTransaction: RecentTransactionDto[]
}