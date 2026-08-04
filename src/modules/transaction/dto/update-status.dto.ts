import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatus } from '@prisma/client';

export class UpdateStatusDto {
  @ApiProperty({ enum: TransactionStatus })
  @IsEnum(TransactionStatus)
  status: TransactionStatus;
}
