import { ApiProperty } from '@nestjs/swagger'

export class AdminSummaryResponseDto {
  @ApiProperty({ example: 15000000 })
  totalRevenue: number

  @ApiProperty({ example: 2500000 })
  todayRevenue: number

  @ApiProperty({ example: 120 })
  totalTransactions: number
}
