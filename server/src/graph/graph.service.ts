// server/src/graph/graph.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Indicator } from '../indicators/entities/indicator.entity';
import { Tag } from '../tags/entities/tag.entity';
import { LayoutService, LayoutType } from './layout.service';

export interface GraphFilters {
  threat_levels?: string[];
  tags?: string[];
  types?: string[];
}

@Injectable()
export class GraphService {
  constructor(
    @InjectRepository(Indicator)
    private indicatorsRepository: Repository<Indicator>,
    @InjectRepository(Tag)
    private tagsRepository: Repository<Tag>,
    private layoutService: LayoutService,
  ) {}

  async getGraphData(filters: GraphFilters = {}, layoutType: LayoutType = 'hierarchical') {
    // Costruisci la query dinamica usando QueryBuilder
    const queryBuilder = this.indicatorsRepository.createQueryBuilder('indicator')
      .leftJoinAndSelect('indicator.tags', 'tag')
      .leftJoinAndSelect('indicator.created_by', 'user');

    // Applica filtri per livelli di minaccia
    if (filters.threat_levels && filters.threat_levels.length > 0) {
      queryBuilder.andWhere('indicator.threat_level IN (:...threat_levels)', { threat_levels: filters.threat_levels });
    }

    // Applica filtri per tipi di indicatori
    if (filters.types && filters.types.length > 0) {
      queryBuilder.andWhere('indicator.type IN (:...types)', { types: filters.types });
    }

    // Applica filtri per tag (indicatori che hanno ALMENO UNO dei tag specificati)
    if (filters.tags && filters.tags.length > 0) {
      queryBuilder.andWhere('tag.id IN (:...tags)', { tags: filters.tags });
    }

    const indicators = await queryBuilder.getMany();
    
    // Se non ci sono indicatori che soddisfano i filtri, non mostrare alcun tag
    if (indicators.length === 0) {
      console.log(`[GRAPH-FILTER] No indicators found with current filters, returning empty graph`);
      return this.layoutService.getLayoutedElements([], []);
    }
    
    // Recupera solo i tag associati agli indicatori filtrati
    const tagIdsFromIndicators = new Set<string>();
    indicators.forEach(indicator => {
      indicator.tags?.forEach(tag => {
        tagIdsFromIndicators.add(tag.id);
      });
    });
    
    // Se filtriamo per tag specifici, usa solo quelli; altrimenti usa tutti i tag degli indicatori
    let relevantTagIds = Array.from(tagIdsFromIndicators);
    if (filters.tags && filters.tags.length > 0) {
      // Mostra solo i tag che sono sia negli indicatori filtrati che nei tag richiesti
      relevantTagIds = filters.tags.filter(tagId => tagIdsFromIndicators.has(tagId));
    }
    
    // Recupera solo i tag rilevanti
    const allTags = relevantTagIds.length > 0 
      ? await this.tagsRepository.findByIds(relevantTagIds)
      : [];

    console.log(`[GRAPH-FILTER] Found ${indicators.length} indicators and ${allTags.length} tags with filters:`, JSON.stringify(filters, null, 2));

    const nodes: any[] = [];
    const edges: any[] = [];

    // Creazione nodi per gli indicatori
    indicators.forEach(indicator => {
      nodes.push({
        id: `indicator-${indicator.id}`,
        type: 'indicatorNode', // Tipo personalizzato per lo stile
        data: { 
          label: indicator.value,
          type: indicator.type,
          threat_level: indicator.threat_level
        },
        // Position will be calculated by LayoutService
      });

      // Creazione archi verso i tag associati
      indicator.tags?.forEach(tag => {
        edges.push({
          id: `edge-${indicator.id}-${tag.id}`,
          source: `indicator-${indicator.id}`,
          target: `tag-${tag.id}`,
          type: 'default',
        });
      });
    });

    // Creazione nodi per i tag (usa allTags che può essere filtrato)
    allTags.forEach(tag => {
      nodes.push({
        id: `tag-${tag.id}`,
        type: 'tagNode', // Tipo personalizzato per lo stile
        data: { 
          label: tag.name
        },
        // Position will be calculated by LayoutService
      });
    });

    // Applica il layout usando l'algoritmo richiesto
    return this.layoutService.getLayoutedElements(nodes, edges, layoutType);
  }
}