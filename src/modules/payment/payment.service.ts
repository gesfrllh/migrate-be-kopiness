// src/payment/payment.service.ts
import { Injectable } from '@nestjs/common'
import { PaymentMethodDto } from './dto/get-payment.dto'
import { ListPaymentMethodsDto } from './dto/list-payment.dto'

@Injectable()
export class PaymentService {
  // static list payment method, gampang diubah nanti pake DB/API
  private paymentMethods: PaymentMethodDto[] = [
    { id: 'dana', name: 'Dana', logoUrl: 'https://tdlbsxwhiusuobvszxvg.supabase.co/storage/v1/object/public/s3/DANA.png' },
    { id: 'gopay', name: 'GoPay', logoUrl: 'https://tdlbsxwhiusuobvszxvg.supabase.co/storage/v1/object/public/s3/Gopay.png' },
    { id: 'sopay', name: 'Shopee Pay', logoUrl: 'https://tdlbsxwhiusuobvszxvg.supabase.co/storage/v1/object/public/s3/Layer%202.png' },
    { id: 'qris', name: 'Qris', logoUrl: 'https://tdlbsxwhiusuobvszxvg.supabase.co/storage/v1/object/public/s3/QRIS.svg' },
  ]

  /**
   * Ambil semua payment methods
   */
  getAllMethods(): ListPaymentMethodsDto {
    return { methods: this.paymentMethods }
  }

  /**
   * Ambil satu payment method by id
   */
  getMethodById(id: string): PaymentMethodDto | undefined {
    return this.paymentMethods.find((m) => m.id === id)
  }
}
