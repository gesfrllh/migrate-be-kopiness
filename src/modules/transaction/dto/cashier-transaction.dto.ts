import { ApiProperty } from "@nestjs/swagger";
import { TransactionStatus } from "@prisma/client";
import { CashierItemDto } from "./cashier-item.dto";
import { CashierUserDto } from "./cashier-user.dto";

export class CashierTransactionDto {
  @ApiProperty()
  id: string

  @ApiProperty({ enum: TransactionStatus })
  status: TransactionStatus

  @ApiProperty()
  createdAt: Date

  @ApiProperty({ type: CashierUserDto })
  user: CashierUserDto

  @ApiProperty({ type: [CashierItemDto] })
  items: CashierItemDto[]

  @ApiProperty()
  totalItem: number

  @ApiProperty()
  estimatedTotal: number

  @ApiProperty()
  orderNumber: string
}