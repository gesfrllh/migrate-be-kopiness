// src/payment/payment.module.ts
import { Module } from '@nestjs/common'
import { PaymentService } from './payment.service'
import { PaymentController } from './payment.controller'

@Module({
  providers: [PaymentService],
  controllers: [PaymentController],
  exports: [PaymentService], // penting biar bisa dipakai di module lain
})
export class PaymentModule { }
