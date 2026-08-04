import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TypingDto {
  @ApiProperty({ example: true, description: 'true saat start ngetik, false saat berhenti' })
  @IsBoolean()
  isTyping: boolean;
}
