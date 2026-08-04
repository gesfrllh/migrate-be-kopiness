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

  @ApiProperty({ required: false, nullable: true })
  courier?: { id: string; name: string } | null

  @ApiProperty({ required: false, nullable: true })
  location?: { latitude: number | null; longitude: number | null; updatedAt: Date } | null

  @ApiProperty()
  destination: { address: string; latitude: number; longitude: number }
}
