// server/src/indicators/dto/update-indicator.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsNumber, IsInt } from 'class-validator';
import { CreateIndicatorDto } from './create-indicator.dto';

export class UpdateIndicatorDto extends PartialType(CreateIndicatorDto) {
  // AbuseIPDB enrichment fields (optional for updates)
  @IsOptional()
  @IsString()
  country_code?: string | null;

  @IsOptional()
  @IsString()
  isp?: string | null;

  @IsOptional()
  @IsInt()
  abuse_score?: number | null;

  @IsOptional()
  @IsString()
  domain_usage?: string | null;

  @IsOptional()
  @IsNumber()
  latitude?: number | null;

  @IsOptional()
  @IsNumber()
  longitude?: number | null;
}
