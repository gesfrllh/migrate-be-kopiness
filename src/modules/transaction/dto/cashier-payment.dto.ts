import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsEnum, IsUUID, ArrayNotEmpty } from 'class-validator'
import { PaymentMethod } from '@prisma/client'

export class PayTransactionsDto {
  @ApiProperty({
    example: ['uuid-1', 'uuid-2'],
    description: 'List of transaction IDs to be paid together'
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  transactionIds: string[]

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CASH
  })
  @IsEnum(PaymentMethod)
  method: PaymentMethod
}


class PaidTransactionDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  orderNumber: string

  @ApiProperty()
  total: number
}

export class PayTransactionsResponseDto {
  @ApiProperty()
  message: string

  @ApiProperty()
  invoiceNumber: string

  @ApiProperty()
  totalAmount: number

  @ApiProperty({ enum: PaymentMethod })
  method: PaymentMethod

  @ApiProperty({ type: [PaidTransactionDto] })
  transactions: PaidTransactionDto[]
}