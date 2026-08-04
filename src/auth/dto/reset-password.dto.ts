import { IsHexadecimal, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsHexadecimal()
  token: string;

  @IsString()
  @MinLength(8)
  password: string;
}
