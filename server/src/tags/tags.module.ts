// server/src/tags/tags.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tag])],
  providers: [], // Aggiungeremo servizi e controller in seguito
  exports: [],
})
export class TagsModule {}