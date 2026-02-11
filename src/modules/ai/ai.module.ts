import { Module } from '@nestjs/common';
import { AiController } from './ai.contoller';
import { AiService } from './ai.service';

@Module({
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService], // kalau nanti mau dipakai module lain
})
export class AiModule { }
