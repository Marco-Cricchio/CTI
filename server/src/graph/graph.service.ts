// server/src/graph/graph.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Indicator } from '../indicators/entities/indicator.entity';
import { Tag } from '../tags/entities/tag.entity';
import { LayoutService } from './layout.service';

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

  async getGraphData(filters: GraphFilters = {}) {
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
    
    // Recupera tutti i tag per la visualizzazione (indipendentemente dai filtri)
    let allTags = await this.tagsRepository.find();
    
    // Se filtriamo per tag, mostra solo i tag filtrati nel grafo
    if (filters.tags && filters.tags.length > 0) {
      allTags = allTags.filter(tag => filters.tags!.includes(tag.id));
    }

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

    // Applica il layout automatico usando Dagre
    return this.layoutService.getLayoutedElements(nodes, edges);
  }
}