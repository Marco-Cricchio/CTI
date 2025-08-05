// server/src/indicators/dto/indicator-response.dto.ts
import { IndicatorType, ThreatLevel } from '../entities/indicator.entity';

export class IndicatorResponseDto {
  id: string;
  value: string;
  type: IndicatorType;
  threat_level: ThreatLevel;
  is_active: boolean;
  first_seen: Date;
  last_seen: Date;
  created_by: {
    id: string;
    email: string;
  };

  // AbuseIPDB enrichment fields (optional)
  country_code?: string | null;
  isp?: string | null;
  abuse_score?: number | null;
  domain_usage?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}
