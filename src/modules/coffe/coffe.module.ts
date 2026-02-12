// src/modules/coffee-assistant/coffee-assistant.module.ts
import { Module } from '@nestjs/common';
import { CoffeeAssistantController } from './coffe.controller';
import { CoffeAssistantService } from './coffe.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CoffeeAssistantController],
  providers: [CoffeAssistantService],
  exports: [CoffeAssistantService]
})
export class CoffeeAssistantModule { }
