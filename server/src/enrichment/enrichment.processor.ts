// server/src/enrichment/enrichment.processor.ts
import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Indicator } from '../indicators/entities/indicator.entity';
import { firstValueFrom } from 'rxjs';

@Processor('enrichment-queue')
export class EnrichmentProcessor {
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Indicator)
    private indicatorsRepository: Repository<Indicator>,
  ) {}

  @Process('enrich-ip')
  async handleIpEnrichment(job: Job<{ indicatorId: string; ipAddress: string }>) {
    const { indicatorId, ipAddress } = job.data;
    const apiKey = process.env.ABUSEIPDB_API_KEY;

    if (!apiKey || apiKey === 'la_tua_chiave_api_qui') {
      console.warn(`No valid AbuseIPDB API key configured for IP enrichment: ${ipAddress}`);
      return;
    }

    try {
      console.log(`Starting enrichment for IP: ${ipAddress} (ID: ${indicatorId})`);
      
      const response = await firstValueFrom(
        this.httpService.get(`https://api.abuseipdb.com/api/v2/check`, {
          headers: { 
            Key: apiKey, 
            Accept: 'application/json' 
          },
          params: { 
            ipAddress: ipAddress, 
            maxAgeInDays: '90',
            verbose: '' // Include additional info like ISP, country, etc.
          },
        }),
      );

      const data = response.data.data;
      console.log(`AbuseIPDB response for ${ipAddress}:`, data);

      // Aggiorna l'indicatore nel database con i dati ricevuti
      await this.indicatorsRepository.update(indicatorId, {
        country_code: data.countryCode || null,
        isp: data.isp || null,
        abuse_score: data.abuseConfidenceScore || 0,
        domain_usage: data.domain ? data.domain.substring(0, 255) : null, // Limita lunghezza per sicurezza
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
      });

      console.log(`Successfully enriched IP ${ipAddress} with AbuseIPDB data`);

    } catch (error) {
      console.error(`Failed to enrich IP ${ipAddress}:`, error.message);
      
      // Log dettagliato per debugging
      if (error.response) {
        console.error('AbuseIPDB API error response:', {
          status: error.response.status,
          data: error.response.data,
        });
      }
      
      // Qui potremmo implementare una logica di retry o notifica
      throw error; // Bull può gestire retry automatici
    }
  }
}