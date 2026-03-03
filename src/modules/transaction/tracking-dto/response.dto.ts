import { ApiProperty } from "@nestjs/swagger";
import { TransactionTrackingItemDto } from "./item.dto";
import { TransactionTrackingStepDto } from "./step.dto";

export class TransactionTrackingResponseDto {
  @ApiProperty({
    example: 'ODR-20260225-0001',
  })
  orderNumber: string

  @ApiProperty({ example: 'PAID' })
  status: string

  @ApiProperty({ example: 75, description: 'Progres order dalam persen' })
  progressPercent: number

  @ApiProperty({
    type: [TransactionTrackingItemDto],
    description: 'Timeline event actual (berdasarkan log)'
  })
  timeline: TransactionTrackingItemDto[]

  @ApiProperty({
    type: [TransactionTrackingStepDto],
    description: 'Blueprint step order'
  })
  steps: TransactionTrackingStepDto[]
}