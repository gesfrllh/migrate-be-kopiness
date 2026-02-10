import { Module } from "@nestjs/common";
import { TransactionController } from "./transaction.controller";
import { TransactionService } from "./transaction.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { AuthModule } from "src/auth/auth.module";
import { PaymentModule } from "../payment/payment.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PaymentModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
})

export class TransactionModule { }