// src/payment/dto/list-payment-methods.dto.ts
import { ApiProperty } from '@nestjs/swagger'
import { PaymentMethodDto } from './get-payment.dto'
import { Type } from 'class-transformer'
import { IsArray, ValidateNested } from 'class-validator'

export class ListPaymentMethodsDto {
  @ApiProperty({ type: [PaymentMethodDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentMethodDto)
  methods: PaymentMethodDto[]
}
