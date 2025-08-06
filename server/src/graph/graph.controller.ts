// server/src/graph/graph.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GraphService } from './graph.service';

@Controller('graph')
@UseGuards(AuthGuard('jwt'))
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  @Get()
  getGraphData(
    @Query('threat_levels') threat_levels?: string | string[],
    @Query('tags') tags?: string | string[],
    @Query('types') types?: string | string[],
    @Query('layout') layout?: string
  ) {
    // Normalize single values to arrays
    const normalizedFilters = {
      threat_levels: Array.isArray(threat_levels) ? threat_levels : threat_levels ? [threat_levels] : undefined,
      tags: Array.isArray(tags) ? tags : tags ? [tags] : undefined,
      types: Array.isArray(types) ? types : types ? [types] : undefined,
    };

    return this.graphService.getGraphData(normalizedFilters, layout as any);
  }
}