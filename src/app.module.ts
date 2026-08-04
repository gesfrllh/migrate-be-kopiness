import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './modules/product/product.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { FileModule } from './file/file.module';
import { AiModule } from './modules/ai/ai.module';
import { CoffeeAssistantModule } from './modules/coffe/coffe.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { StoreModule } from './modules/store/store.module';
import { CartModule } from './modules/cart/cart.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 60,
        },
      ],
    }),
    AuthModule,
    ProductModule,
    TransactionModule,
    FileModule,
    AiModule,
    DashboardModule,
    CoffeeAssistantModule,
    StoreModule,
    CartModule,
    ChatModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
