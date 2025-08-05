// server/src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterUserDto): Promise<Omit<User, 'password_hash'>> {
    const existingUser = await this.usersRepository.findOne({ where: { email: registerDto.email } });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const salt = await bcrypt.genSalt();
    const password_hash = await bcrypt.hash(registerDto.password, salt);

    const newUser = this.usersRepository.create({
      email: registerDto.email,
      password_hash,
    });

    const savedUser = await this.usersRepository.save(newUser);
    const { password_hash: _, ...result } = savedUser;
    return result;
  }

  async login(loginDto: RegisterUserDto): Promise<{ accessToken: string }> {
    const user = await this.usersRepository.findOne({ where: { email: loginDto.email } });
    if (user && (await bcrypt.compare(loginDto.password, user.password_hash))) {
      const payload = { sub: user.id, email: user.email, role: user.role };
      return {
        accessToken: this.jwtService.sign(payload),
      };
    }
    throw new UnauthorizedException('Please check your login credentials');
  }
}