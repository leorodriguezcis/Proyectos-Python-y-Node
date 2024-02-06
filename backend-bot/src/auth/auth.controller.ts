import { Controller, Post, UseGuards, Req, Body, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from 'src/guards/local-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Token } from '../types/token.type';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { validationPipe } from 'src/pipes/ValidationPipe';

@Controller('auth')
@ApiTags('Auth')
@UsePipes(validationPipe)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: CreateUserDto): Promise<Token> {
    return this.authService.register(dto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() dto: LoginUserDto): Promise<Token> {
    return this.authService.login(dto);
  }
}
