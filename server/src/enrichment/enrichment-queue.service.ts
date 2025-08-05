// server/src/enrichment/enrichment-queue.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class EnrichmentQueueService implements OnModuleDestroy {
  constructor(@InjectQueue('enrichment-queue') public readonly queue: Queue) {}

  async onModuleDestroy() {
    console.log('Closing enrichment queue connection...');
    await this.queue.close();
    console.log('Enrichment queue connection closed.');
  }
}