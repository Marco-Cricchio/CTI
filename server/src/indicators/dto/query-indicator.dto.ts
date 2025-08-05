import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { IndicatorType, ThreatLevel } from '../entities/indicator.entity';

export class QueryIndicatorDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(IndicatorType)
  type?: IndicatorType;

  @IsOptional()
  @IsEnum(ThreatLevel)
  threat_level?: ThreatLevel;
}
