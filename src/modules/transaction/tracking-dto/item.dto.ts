import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TransactionAction } from "@prisma/client";

export class TransactionTrackingItemDto {
  @ApiProperty({
    example: 1,
    description: 'Urutan Step tracking'
  })
  step: number

  @ApiProperty({
    example: 'CREATED',
    description: 'Action enum dari transaction log'
  })
  action: TransactionAction

  @ApiProperty({
    example: 'Pesanan dibuat'
  })
  label: string

  @ApiPropertyOptional({
    example: 'Metode pembayaran: dana'
  })
  description?: string

  @ApiProperty({
    example: '2026-02-25T04:12:01.919Z',
    type: String,
    format: 'date-time'
  })
  createdAt: Date
}