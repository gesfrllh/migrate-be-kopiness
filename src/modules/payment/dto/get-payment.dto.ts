// src/payment/dto/get-payment-methods.dto.ts
import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsOptional } from 'class-validator'

export class PaymentMethodDto {
  @ApiProperty({ description: 'Unique ID for payment method', example: 'credit_card' })
  @IsString()
  id: string

  @ApiProperty({ description: 'Display name of the payment method', example: 'Credit Card' })
  @IsString()
  name: string

  @ApiProperty({ description: 'Optional logo URL', example: 'https://example.com/cc.png', required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string
}
