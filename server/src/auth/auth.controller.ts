// server/src/auth/auth.controller.ts
// CORREZIONE: Aggiungi ValidationPipe e HttpCode agli import
import { Controller, Post, Body, HttpCode, HttpStatus, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  // CORREZIONE: Aggiungi new ValidationPipe() per forzare la validazione corretta
  register(@Body(new ValidationPipe()) registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: RegisterUserDto) { // Riutilizziamo il DTO per semplicità
    return this.authService.login(loginDto);
  }
}