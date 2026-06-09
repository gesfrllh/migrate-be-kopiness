import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class StoreOwnerDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
}

export class StoreResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() slug: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() logoUrl?: string;
  @ApiPropertyOptional() address?: string;
  @ApiPropertyOptional() phone?: string;
  @ApiPropertyOptional() latitude?: number;
  @ApiPropertyOptional() longitude?: number;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiProperty({ type: StoreOwnerDto }) owner: StoreOwnerDto;
}

export class StoreListOwnedResponseDto {
  @ApiProperty({ type: [StoreResponseDto] })
  data: StoreResponseDto[];
}