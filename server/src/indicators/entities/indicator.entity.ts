// server/src/indicators/entities/indicator.entity.ts
import { User } from '../../auth/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';

export enum ThreatLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum IndicatorType {
  IP = 'ip',
  DOMAIN = 'domain',
  URL = 'url',
  FILE_HASH = 'file_hash',
  EMAIL = 'email',
}

@Entity('indicators')
export class Indicator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  value: string;

  @Column({ type: 'enum', enum: IndicatorType, nullable: false })
  type: IndicatorType;

  @Column({ type: 'enum', enum: ThreatLevel, default: ThreatLevel.LOW })
  threat_level: ThreatLevel;

  @Column({ default: true })
  is_active: boolean;

  @ManyToOne(() => User, { nullable: false, eager: true }) // eager loads the user
  created_by: User;

  @CreateDateColumn()
  first_seen: Date;

  @UpdateDateColumn()
  last_seen: Date;

  // AbuseIPDB enrichment fields
  @Column({ type: 'varchar', nullable: true })
  country_code: string | null;

  @Column({ type: 'varchar', nullable: true })
  isp: string | null;

  @Column({ type: 'integer', nullable: true })
  abuse_score: number | null;

  @Column({ type: 'text', nullable: true })
  domain_usage: string | null; // Per memorizzare un riassunto dei domini associati

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;
}
