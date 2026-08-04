import {
  Controller,
  Get,
  Post,
  Patch,
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
import { TransactionTrackingResponseDto } from './tracking-dto/response.dto'
import { UpdateStatusDto } from './dto/update-status.dto'
import { AssignCourierDto } from './dto/assign-courier.dto'
import { UpdateCourierLocationDto } from './dto/update-courier-location.dto'

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
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
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
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.STOREOWNER)
  @ApiOkResponse({
    description: 'List pending transaction',
    type: CashierTransactionDto,
    isArray: true,
  })
  getCashierQueue(@Req() req: express.Request): Promise<CashierTransactionDto[]> {
    return this.transactionService.getCashierQueue(req.user!)
  }

  @Post('payment')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.STOREOWNER)
  @ApiBody({ type: PayTransactionsDto })
  @ApiOkResponse({
    description: 'Transactions paid successfully',
    type: PayTransactionsResponseDto,
  })
  payMultiple(@Body() dto: PayTransactionsDto, @Req() req: express.Request) {
    return this.transactionService.pay(dto, req.user!)
  }


  @Post(':id/cancel')
  @UseGuards(JwtGuard)
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({
    description: 'Transaction cancelled',
  })
  cancel(@Param('id') id: string, @Req() req: express.Request) {
    if (!req.user) throw new UnauthorizedException()
    return this.transactionService.cancel(id, req.user.id)
  }

  @Post('history')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.SUPERADMIN)
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
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Admin transaction summary dashboard' })
  @ApiOkResponse({
    description: 'Admin summary',
    type: AdminSummaryResponseDto,
  })
  getAdminSummary() {
    return this.transactionService.getAdminSummary()
  }

  @Get('store/orders')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.STOREOWNER)
  @ApiOperation({ summary: 'StoreOwner get their store orders' })
  getStoreOrders(
    @Req() req: express.Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    if (!req.user) throw new UnauthorizedException()
    return this.transactionService.getStoreOrders(req.user.id, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
    })
  }

  @Get('courier/orders')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.COURIER)
  @ApiOperation({ summary: 'Courier gets assigned delivery orders' })
  getCourierOrders(@Req() req: express.Request) {
    return this.transactionService.getCourierOrders(req.user!.id)
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get transaction detail' })
  @ApiParam({ name: 'id', type: String })
  getDetail(@Param('id') id: string, @Req() req: express.Request) {
    return this.transactionService.getDetail(id, req.user!)
  }

  @Patch(':id/status')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.STOREOWNER, UserRole.COURIER)
  @ApiOperation({ summary: 'StoreOwner or assigned courier update order status' })
  @ApiBody({ type: UpdateStatusDto })
  updateStatus(
    @Param('id') id: string,
    @Req() req: express.Request,
    @Body() dto: UpdateStatusDto,
  ) {
    if (!req.user) throw new UnauthorizedException()
    return this.transactionService.updateStatus(id, req.user.id, dto)
  }

  @Patch(':id/courier')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.STOREOWNER)
  @ApiOperation({ summary: 'StoreOwner assigns a courier to an order' })
  assignCourier(
    @Param('id') id: string,
    @Req() req: express.Request,
    @Body() dto: AssignCourierDto,
  ) {
    if (!req.user) throw new UnauthorizedException()
    return this.transactionService.assignCourier(id, req.user.id, dto.courierId)
  }

  @Patch(':id/courier-location')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.COURIER)
  @ApiOperation({ summary: 'Assigned courier updates their latest location' })
  updateCourierLocation(
    @Param('id') id: string,
    @Req() req: express.Request,
    @Body() dto: UpdateCourierLocationDto,
  ) {
    if (!req.user) throw new UnauthorizedException()
    return this.transactionService.updateCourierLocation(id, req.user.id, dto)
  }

  @Get(':id/tracking')
  @UseGuards(JwtGuard)
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiOkResponse({
    description: 'Order Tracking timeline',
    type: TransactionTrackingResponseDto
  })
  getTracking(@Param('id') id: string, @Req() req: express.Request) {
    return this.transactionService.getTracking(id, req.user!)
  }
}


