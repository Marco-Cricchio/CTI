// server/src/graph/graph.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GraphService } from './graph.service';

@Controller('graph')
@UseGuards(AuthGuard('jwt'))
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  @Get()
  getGraphData() {
    return this.graphService.getGraphData();
  }
}