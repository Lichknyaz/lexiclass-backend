import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthUserDto } from './types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() input: RegisterDto) {
    return this.authService.register(input);
  }

  @HttpCode(200)
  @Post('login')
  login(@Body() input: LoginDto) {
    return this.authService.login(input);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUserDto) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @Post('logout')
  logout() {
    return this.authService.logout();
  }
}
