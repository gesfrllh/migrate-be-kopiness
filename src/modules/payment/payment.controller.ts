// src/payment/payment.controller.ts
import { Controller, Get, Param, NotFoundException, UseGuards } from '@nestjs/common'
import { PaymentService } from './payment.service'
import { ApiOkResponse, ApiTags, ApiParam } from '@nestjs/swagger'
import { ListPaymentMethodsDto } from './dto/list-payment.dto'
import { PaymentMethodDto } from './dto/get-payment.dto'
import { JwtGuard } from '../../common/guards/jwt.guard'

@ApiTags('Payment')
@Controller('payment-methods')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  /**
   * Ambil semua payment methods
   */
  @Get()
  @UseGuards(JwtGuard)
  @ApiOkResponse({
    description: 'List of available payment methods',
    type: ListPaymentMethodsDto,
  })
  getAll() {
    return this.paymentService.getAllMethods()
  }

  /**
   * Ambil detail payment method by ID
   */
  @Get(':id')
  @UseGuards(JwtGuard)
  @ApiParam({ name: 'id', description: 'Payment method ID', example: 'credit_card' })
  @ApiOkResponse({
    description: 'Payment method detail',
    type: PaymentMethodDto,
  })
  getById(@Param('id') id: string) {
    const method = this.paymentService.getMethodById(id)
    if (!method) throw new NotFoundException('Payment method not found')
    return method
  }
}
