import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChatDto {
  @ApiProperty({ example: 'uuid-store-id' })
  @IsUUID()
  storeId: string;
}
