// server/src/enrichment/enrichment.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnrichmentProcessor } from './enrichment.processor';
import { EnrichmentQueueService } from './enrichment-queue.service';
import { Indicator } from '../indicators/entities/indicator.entity';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'enrichment-queue',
    }),
    HttpModule,
    TypeOrmModule.forFeature([Indicator]),
  ],
  providers: [EnrichmentProcessor, EnrichmentQueueService],
  exports: [EnrichmentQueueService], // Esporta il servizio
})
export class EnrichmentModule {}