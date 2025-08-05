// server/src/tags/tags.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { AuthModule } from '../auth/auth.module';
import { User } from '../auth/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tag, User]),
    AuthModule,
  ],
  providers: [TagsService],
  controllers: [TagsController],
  exports: [],
})
export class TagsModule {}