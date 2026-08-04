import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { CreateStoreOwnerDto } from './dto/create-storeowner.dto';
import { CreateCourierDto } from './dto/create-courier.dto';
import { UserResponseDto } from '../common/types/auth';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleAuthGuard } from '../common/guards/google-auth.guard';
import { JwtAuthGuard } from '../common/guards/jwt.auth.guard';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { encryptToken } from '../utils/crypto.utils';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('register')
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, type: UserResponseDto })
  async register(@Body() data: RegisterDto): Promise<UserResponseDto> {
    return this.authService.register(data);
  }

  @Post('storeowners')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiBody({ type: CreateStoreOwnerDto })
  @ApiResponse({ status: 201, type: UserResponseDto })
  async createStoreOwner(
    @Body() dto: CreateStoreOwnerDto,
    @Req() req,
  ): Promise<UserResponseDto> {
    return this.authService.createStoreOwner(dto, req.user.id);
  }

  @Post('couriers')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiBody({ type: CreateCourierDto })
  @ApiResponse({ status: 201, type: UserResponseDto })
  createCourier(@Body() dto: CreateCourierDto): Promise<UserResponseDto> {
    return this.authService.createCourier(dto)
  }

  @Get('users')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  getUsers() {
    return this.authService.getUsers();
  }

  @Get('couriers')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.STOREOWNER)
  getCouriers() {
    return this.authService.getCouriers()
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
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res,
  ): Promise<{ user: UserResponseDto; isLoggedIn: boolean }> {
    const { token, user } =
      await this.authService.login(body.email, body.password);

    const encryptedToken = encryptToken(token)

    const isProduction = process.env.NODE_ENV === 'production'

    res.cookie('access_token', encryptedToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { user, isLoggedIn: true };
  }


  @Post('logout')
  async logout(@Req() req, @Res({ passthrough: true }) res) {
    const encryptedToken = req.cookies?.access_token;
    if (encryptedToken) {
      await this.authService.logout(encryptedToken);
    }

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('access_token', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 0,
    });

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

    const isProduction = process.env.NODE_ENV === 'production'

    res.cookie('access_token', encryptedToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:3000'
    return res.redirect(`${frontendUrl}/auth`)
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

  @Post('forgot-password')
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestResetPassword(dto.email)
  }

  @Post('reset-password')
  reset(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password)
  }
}
