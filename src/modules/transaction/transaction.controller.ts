import {
  Controller,
  Get,
  Post,
  UseGuards,
  Body,
  Req,
  UnauthorizedException,
  Param,
} from '@nestjs/common'
import { TransactionService } from './transaction.service'
import { JwtGuard } from 'src/common/guards/jwt.guard'
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger'
import express from 'express'
import { CreateTransactionDto } from './dto/create-transaction.dto'
import { CashierTransactionDto } from './dto/cashier-transaction.dto'

@ApiTags('Transaction')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
  ) { }

  /**
   * FE Cart → submit ke kasir
   */
  @Post()
  @UseGuards(JwtGuard)
  @ApiBody({ type: CreateTransactionDto })
  @ApiCreatedResponse({
    description: 'Transaction submitted to cashier',
    type: CashierTransactionDto,
  })
  create(
    @Body() dto: CreateTransactionDto,
    @Req() req: express.Request,
  ): Promise<CashierTransactionDto> {
    if (!req.user) throw new UnauthorizedException()

    return this.transactionService.createFromCart(
      req.user.id,
      dto,
    )
  }

  /**
   * FE Kasir → list antrian
   */
  @Get()
  @UseGuards(JwtGuard)
  @ApiOkResponse({
    description: 'List pending transaction',
    type: CashierTransactionDto,
    isArray: true,
  })
  getCashierQueue(): Promise<CashierTransactionDto[]> {
    return this.transactionService.getCashierQueue()
  }

  @Post(':id/payment')
  @UseGuards(JwtGuard)
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({
    description: 'Transaction paid successfully'
  })

  pay(@Param('id') id: string) {
    return this.transactionService.pay(id)
  }

  @Post(':id/cancel')
  @UseGuards(JwtGuard)
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({
    description: 'Transaction cancelled',
  })
  cancel(@Param('id') id: string) {
    return this.transactionService.cancel(id)
  }
}


