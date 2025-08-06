// server/src/graph/graph.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Indicator } from '../indicators/entities/indicator.entity';
import { Tag } from '../tags/entities/tag.entity';
import { LayoutService } from './layout.service';

@Injectable()
export class GraphService {
  constructor(
    @InjectRepository(Indicator)
    private indicatorsRepository: Repository<Indicator>,
    @InjectRepository(Tag)
    private tagsRepository: Repository<Tag>,
    private layoutService: LayoutService,
  ) {}

  async getGraphData() {
    const indicators = await this.indicatorsRepository.find({ relations: ['tags'] });
    const tags = await this.tagsRepository.find();

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

    // Creazione nodi per i tag
    tags.forEach(tag => {
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