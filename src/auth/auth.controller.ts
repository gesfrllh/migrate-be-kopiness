import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { UserResponseDto } from 'src/types/auth';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, type: UserResponseDto })
  async register(@Body() data: RegisterDto): Promise<UserResponseDto> {
    return this.authService.register(data);
  }

  @Post('login')
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        token: 'jwt-token-string',
        user: {
          id: 1,
          email: 'jhondoe@email.com',
          fullName: 'John Doe',
        },
      },
    },
  })
  async login(
    @Body() body: { email: string; password: string },
  ): Promise<{ token: string; user: UserResponseDto }> {
    return this.authService.login(body.email, body.password);
  }
}
