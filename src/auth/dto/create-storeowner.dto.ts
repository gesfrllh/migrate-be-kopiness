import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStoreOwnerDto {
  @ApiProperty({ example: 'Budi Store', description: 'Full name of the store owner' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'budi@email.com', description: 'Email address of the store owner' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongPassword123', description: 'Password for the account' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Kopiness Store', description: 'Initial store name', required: false })
  @IsOptional()
  @IsString()
  storeName?: string;
}
