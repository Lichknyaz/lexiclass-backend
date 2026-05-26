import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthUserDto } from './types';
import {
  AuthSessionResponseDto,
  AuthUserResponseDto,
} from '../swagger/api-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a teacher or student account' })
  @ApiCreatedResponse({ type: AuthSessionResponseDto })
  register(@Body() input: RegisterDto) {
    return this.authService.register(input);
  }

  @HttpCode(200)
  @Post('login')
  @ApiOperation({ summary: 'Login with email, password, and role' })
  @ApiOkResponse({ type: AuthSessionResponseDto })
  login(@Body() input: LoginDto) {
    return this.authService.login(input);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get the current authenticated user' })
  @ApiOkResponse({ type: AuthUserResponseDto })
  me(@CurrentUser() user: AuthUserDto) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @Post('logout')
  @ApiOperation({ summary: 'Logout current session' })
  @ApiNoContentResponse()
  logout() {
    return this.authService.logout();
  }
}
