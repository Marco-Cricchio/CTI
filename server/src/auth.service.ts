import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './auth/entities/user.entity';
import { RegisterUserDto } from './auth/dto/register-user.dto';
import * as bcrypt from 'bcryptjs';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}
  async register(
    registerDto: RegisterUserDto,
  ): Promise<Omit<User, 'password_hash'>> {
    const { email, password } = registerDto;
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const salt = await bcrypt.genSalt();
    const password_hash = await bcrypt.hash(password, salt);
    const user = this.usersRepository.create({ email, password_hash });

    const savedUser = await this.usersRepository.save(user);

    // CORREZIONE: Crea un nuovo oggetto senza la password hash invece di usare 'delete'
    const { password_hash: _, ...result } = savedUser;
    return result;
  }
}
