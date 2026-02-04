import { BadRequestException, Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { UserResponseDto } from 'src/common/types/auth';
import { ApiBody, ApiResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthGuard } from 'src/common/guards/google-auth.guard';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt.auth.guard';
import { Response, Request } from 'express';

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
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res,
  ): Promise<{ user: UserResponseDto }> {
    const { cookie, user } = await this.authService.login(
      body.email,
      body.password,
    )

    res.setHeader('Set-Cookie', cookie)

    return { user }
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res) {
    res.setHeader(
      'Set-Cookie',
      'access_token=; HttpOnly; Path=/; Max-Age=0',
    )

    return { message: 'Successfully logged out' }
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() { }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req, @Res() res) {
    const { cookie } = await this.authService.handleGoogleLogin(req.user)

    res.setHeader('Set-Cookie', cookie)

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
