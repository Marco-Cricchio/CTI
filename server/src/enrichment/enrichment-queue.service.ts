// server/src/enrichment/enrichment-queue.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class EnrichmentQueueService implements OnModuleDestroy {
  constructor(@InjectQueue('enrichment-queue') public readonly queue: Queue) {}

  async onModuleDestroy() {
    console.log('Closing enrichment queue connection...');
    
    try {
      // Chiudi la queue
      await this.queue.close();
      
      // Accedi al client Redis sottostante e chiudilo esplicitamente
      const redisClient = (this.queue as any).client;
      const subscriberClient = (this.queue as any).bclient;
      
      if (redisClient && typeof redisClient.disconnect === 'function') {
        console.log('Disconnecting Redis client...');
        await redisClient.disconnect();
      }
      
      if (subscriberClient && typeof subscriberClient.disconnect === 'function') {
        console.log('Disconnecting Redis subscriber client...');
        await subscriberClient.disconnect();
      }
      
      console.log('Enrichment queue and Redis connections closed completely.');
    } catch (error) {
      console.error('Error closing enrichment queue connections:', error);
    }
  }
}