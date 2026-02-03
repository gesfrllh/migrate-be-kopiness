import { BadRequestException, Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { UserResponseDto } from 'src/common/types/auth';
import { ApiBody, ApiResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthGuard } from 'src/common/guards/google-auth.guard';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt.auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

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

  @Post('logout')
  @ApiResponse({ status: 200, schema: { example: { message: 'Successfully logged out' } } })
  async logout(@Req() req): Promise<{ message: string }> {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new BadRequestException('Authorization header is missing');

    return this.authService.logout(authHeader);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() { }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req, @Res() res) {
    const { token } =
      await this.authService.handleGoogleLogin(req.user)

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: false, // true kalau HTTPS
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    return res.redirect('http://localhost:3000/auth')
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req) {
    return {
      isLoggedIn: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      }
    }
  }
}
