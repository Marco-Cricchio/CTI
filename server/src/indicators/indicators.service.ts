// server/src/indicators/indicators.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Indicator, ThreatLevel } from './entities/indicator.entity';
import { CreateIndicatorDto } from './dto/create-indicator.dto';
import { UpdateIndicatorDto } from './dto/update-indicator.dto';
import { QueryIndicatorDto } from './dto/query-indicator.dto';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class IndicatorsService {
  constructor(
    @InjectRepository(Indicator)
    private indicatorsRepository: Repository<Indicator>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createIndicatorDto: CreateIndicatorDto, user: User): Promise<Indicator> {
    // CORREZIONE: Ottieni un reference pulito all'utente dal database
    // Questo evita problemi di entità "managed" o "detached" con TypeORM
    const userReference = this.usersRepository.create({ id: user.id });
    
    const indicator = this.indicatorsRepository.create({
      ...createIndicatorDto,
      created_by: userReference,
    });
    
    const savedIndicator = await this.indicatorsRepository.save(indicator);
    
    // Ricarica l'indicatore con l'eager loading per ottenere l'utente completo
    return this.indicatorsRepository.findOne({ 
      where: { id: savedIndicator.id },
      relations: ['created_by']
    });
  }

  async findAll(queryDto: QueryIndicatorDto): Promise<{ data: Indicator[], total: number }> {
    const { page = 1, limit = 10, search, type, threat_level } = queryDto;
    const queryBuilder = this.indicatorsRepository.createQueryBuilder('indicator');

    queryBuilder
      .where('indicator.is_active = :isActive', { isActive: true })
      .leftJoinAndSelect('indicator.created_by', 'user') // Carica l'utente associato
      .select(['indicator', 'user.id', 'user.email']) // Seleziona solo i campi necessari
      .orderBy('indicator.last_seen', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (type) {
      queryBuilder.andWhere('indicator.type = :type', { type });
    }

    if (threat_level) {
      queryBuilder.andWhere('indicator.threat_level = :threat_level', { threat_level });
    }

    if (search) {
      queryBuilder.andWhere('indicator.value ILIKE :search', { search: `%${search}%` });
    }

    const [data, total] = await queryBuilder.getManyAndCount();
    
    return { data, total };
  }

  async findOne(id: string): Promise<Indicator> {
    const indicator = await this.indicatorsRepository.findOne({ 
      where: { id, is_active: true },
      relations: ['created_by']
    });
    if (!indicator) {
      throw new NotFoundException(`Indicator with ID "${id}" not found`);
    }
    return indicator;
  }

  async update(id: string, updateIndicatorDto: UpdateIndicatorDto): Promise<Indicator> {
    // Il metodo 'preload' crea una nuova entità basata sull'oggetto passato.
    // Carica l'entità esistente dal database e la sostituisce con i nuovi valori.
    const indicator = await this.indicatorsRepository.preload({
      id: id,
      ...updateIndicatorDto,
    });

    if (!indicator) {
      throw new NotFoundException(`Indicator with ID "${id}" not found`);
    }

    return this.indicatorsRepository.save(indicator);
  }

  async softDelete(id: string): Promise<void> {
    const result = await this.indicatorsRepository.update(id, { is_active: false });
    if (result.affected === 0) {
      throw new NotFoundException(`Indicator with ID "${id}" not found`);
    }
  }

  async getDashboardStats(): Promise<any> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const newIocsCount = await this.indicatorsRepository.count({
      where: { first_seen: MoreThan(twentyFourHoursAgo) },
    });

    const criticalAlertsCount = await this.indicatorsRepository.count({
      where: { threat_level: ThreatLevel.CRITICAL, is_active: true },
    });

    const totalActiveIndicators = await this.indicatorsRepository.count({
      where: { is_active: true },
    });

    // Per ora, questi sono valori fittizi che implementeremo in futuro
    const activeInvestigations = 5; 
    const dataFeeds = 8;

    return {
      newIocs24h: newIocsCount,
      criticalAlerts: criticalAlertsCount,
      totalActiveIndicators,
      activeInvestigations,
      dataFeeds,
    };
  }
}