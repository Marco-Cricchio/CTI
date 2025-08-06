// server/src/graph/graph.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphController } from './graph.controller';
import { GraphService } from './graph.service';
import { Indicator } from '../indicators/entities/indicator.entity';
import { Tag } from '../tags/entities/tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Indicator, Tag])],
  controllers: [GraphController],
  providers: [GraphService],
})
export class GraphModule {}