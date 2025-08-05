// server/src/config/typeorm.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../auth/entities/user.entity';
import { Indicator } from '../indicators/entities/indicator.entity';

export const typeOrmAsyncConfig = {
  useFactory: async (configService: ConfigService): Promise<TypeOrmModuleOptions> => {
    return {
      type: 'postgres',
      url: configService.get<string>('DATABASE_URL'),
      entities: [User, Indicator],
      migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
      synchronize: true, // Solo per sviluppo - useremo migrazioni in produzione
      logging: true,
    };
  },
  inject: [ConfigService],
};