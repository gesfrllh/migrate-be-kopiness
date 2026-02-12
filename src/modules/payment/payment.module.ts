// src/payment/payment.module.ts
import { Module } from '@nestjs/common'
import { PaymentService } from './payment.service'
import { PaymentController } from './payment.controller'
import { AuthModule } from 'src/auth/auth.module'

@Module({
  imports: [AuthModule],
  providers: [PaymentService],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule { }
