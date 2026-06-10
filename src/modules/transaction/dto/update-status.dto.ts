import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatus } from '@prisma/client';

export class UpdateStatusDto {
  @ApiProperty({ enum: [TransactionStatus.IN_PROGRESS, TransactionStatus.DELIVERED] })
  @IsEnum(TransactionStatus)
  status: TransactionStatus;
}
