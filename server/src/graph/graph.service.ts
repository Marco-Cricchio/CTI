// server/src/graph/graph.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Indicator } from '../indicators/entities/indicator.entity';
import { Tag } from '../tags/entities/tag.entity';

@Injectable()
export class GraphService {
  constructor(
    @InjectRepository(Indicator)
    private indicatorsRepository: Repository<Indicator>,
    @InjectRepository(Tag)
    private tagsRepository: Repository<Tag>,
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
          threatLevel: indicator.threat_level
        },
        position: { x: Math.random() * 800, y: Math.random() * 600 }, // Posizione iniziale casuale
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
        position: { x: Math.random() * 800, y: Math.random() * 600 },
      });
    });

    return { nodes, edges };
  }
}