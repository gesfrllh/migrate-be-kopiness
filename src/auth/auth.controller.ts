import { BadRequestException, Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { UserResponseDto } from 'src/common/types/auth';
import { ApiBody, ApiResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthGuard } from 'src/common/guards/google-auth.guard';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt.auth.guard';
import { encryptToken } from 'src/utils/crypto.utils';
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
  ): Promise<{ user: UserResponseDto; isLoggedIn: boolean }> {
    const { token, user } =
      await this.authService.login(body.email, body.password);

    const encryptedToken = encryptToken(token)
    console.log(encryptedToken)

    res.cookie('access_token', encryptedToken, {
      httpOnly: true,
      secure: false, // true di prod
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { user, isLoggedIn: true };
  }


  @Post('logout')
  async logout(@Res({ passthrough: true }) res) {
    res.setHeader(
      'Set-Cookie',
      'access_token=; HttpOnly; Path=/; Max-Age=0',
    )

    return { message: 'Successfully logged out', isLoggedIn: false }
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() { }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req, @Res() res) {
    const { token } = await this.authService.handleGoogleLogin(req.user)

    const encryptedToken = encryptToken(token)

    res.cookie('access_token', encryptedToken, {
      httpOnly: true,
      secure: false, // true di prod
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

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
