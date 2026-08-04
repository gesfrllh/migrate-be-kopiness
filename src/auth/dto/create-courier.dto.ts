import { IsEmail, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateCourierDto {
  @ApiProperty({ example: 'Budi Kurir' })
  @IsString()
  name: string

  @ApiProperty({ example: 'kurir@kopiness.id' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'strongPassword123' })
  @IsString()
  @MinLength(6)
  password: string
}
