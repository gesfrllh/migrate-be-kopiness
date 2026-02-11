import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './modules/product/product.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { FileModule } from './file/file.module';
import { AiModule } from './modules/ai/ai.module';
import { CoffeeAssistantModule } from './modules/coffe/coffe.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    ProductModule,
    TransactionModule,
    FileModule,
    AiModule,
    CoffeeAssistantModule,
  ],
})
export class AppModule { }
