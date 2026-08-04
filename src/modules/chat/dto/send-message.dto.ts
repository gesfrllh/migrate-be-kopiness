import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ example: 'Halo, apakah stok masih ada?' })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiPropertyOptional({ example: 'uuid-message-id' })
  @IsOptional()
  @IsUUID()
  replyToId?: string;
}
