import { DataSource } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Indicator } from '../indicators/entities/indicator.entity';
import { Tag } from '../tags/entities/tag.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/cyberforge_dev',
  entities: [User, Indicator, Tag],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false, // For migrations
  logging: true,
});
