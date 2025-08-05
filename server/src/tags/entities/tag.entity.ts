// server/src/tags/entities/tag.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Indicator } from '../../indicators/entities/indicator.entity';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @ManyToMany(() => Indicator, (indicator) => indicator.tags)
  indicators: Indicator[];
}