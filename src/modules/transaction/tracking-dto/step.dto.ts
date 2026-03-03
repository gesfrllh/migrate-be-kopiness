import { ApiProperty } from "@nestjs/swagger";

export class TransactionTrackingStepDto {
  @ApiProperty({ example: 1 })
  step: number

  @ApiProperty({ example: 'CREATED' })
  action: string

  @ApiProperty({ example: 'Pesanan dibuat' })
  label: string

  @ApiProperty({ example: false, description: 'Apakah pesanan sudah dilewati' })
  completed: boolean

  @ApiProperty({ example: true, description: 'Step yang aktif' })
  active: boolean

  @ApiProperty({
    example: '2026-02-25T04:12:01.919Z',
    nullable: true,
    type: String,
    format: 'date-time',
  })
  timestamp: Date | null
}