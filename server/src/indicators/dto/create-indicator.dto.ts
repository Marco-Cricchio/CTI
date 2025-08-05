// server/src/indicators/dto/create-indicator.dto.ts
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { IndicatorType, ThreatLevel } from '../entities/indicator.entity';

export class CreateIndicatorDto {
  @IsString()
  @IsNotEmpty()
  value: string;

  @IsEnum(IndicatorType)
  type: IndicatorType;

  @IsEnum(ThreatLevel)
  threat_level: ThreatLevel;
}
