import {
  Controller,
  Get,
  Post,
  UseGuards,
  Body,
  Req,
  UnauthorizedException,
  Param,
  Query
} from '@nestjs/common'
import { TransactionService } from './transaction.service'
import { JwtGuard } from '../../common/guards/jwt.guard'
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
  ApiOperation,
} from '@nestjs/swagger'
import express from 'express'
import { CreateTransactionDto } from './dto/create-transaction.dto'
import { CashierTransactionDto } from './dto/cashier-transaction.dto'
import { PayTransactionsDto, PayTransactionsResponseDto } from './dto/cashier-payment.dto'
import { UserHistoryQueryDto } from './dto/user-history-query.dto'
import { AdminHistoryQueryDto } from './dto/admin-history-query.dto'
import { AdminSummaryResponseDto } from './dto/admin-summary-response.dto'
import { Roles } from 'src/common/decorators/roles.decorator'
import { UserRole } from '@prisma/client'
import { RolesGuard } from 'src/common/guards/roles.guard'

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

  @Post('payment')
  @UseGuards(JwtGuard)
  @ApiBody({ type: PayTransactionsDto })
  @ApiOkResponse({
    description: 'Transactions paid successfully',
    type: PayTransactionsResponseDto,
  })
  payMultiple(@Body() dto: PayTransactionsDto) {
    return this.transactionService.pay(dto)
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

  @Post('history')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  async getHistory(
    @Req() req: express.Request,
    @Body() query: AdminHistoryQueryDto,
  ) {
    if (!req.user) throw new UnauthorizedException()
    return this.transactionService.getHistory(req.user, query)
  }


  /**
   * ADMIN → Dashboard summary
   */
  @Get('admin/summary')
  @UseGuards(JwtGuard)
  // @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin transaction summary dashboard' })
  @ApiOkResponse({
    description: 'Admin summary',
    type: AdminSummaryResponseDto,
  })
  getAdminSummary() {
    return this.transactionService.getAdminSummary()
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get transaction detail' })
  @ApiParam({ name: 'id', type: String })
  getDetail(@Param('id') id: string) {
    return this.transactionService.getDetail(id)
  }
}


