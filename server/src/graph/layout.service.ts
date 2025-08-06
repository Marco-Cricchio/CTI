// server/src/graph/layout.service.ts
import { Injectable } from '@nestjs/common';
import * as dagre from 'dagre';

export interface GraphNode {
  id: string;
  type: string;
  data: any;
  position?: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

@Injectable()
export class LayoutService {
  getLayoutedElements(nodes: GraphNode[], edges: GraphEdge[]) {
    const g = new dagre.graphlib.Graph();
    
    // Configurazione del layout
    g.setGraph({ 
      rankdir: 'TB',        // Top-to-Bottom layout
      nodesep: 120,         // Spaziatura orizzontale tra nodi
      ranksep: 80,          // Spaziatura verticale tra livelli
      marginx: 20,          // Margine orizzontale
      marginy: 20           // Margine verticale
    });
    
    g.setDefaultEdgeLabel(() => ({}));

    // Aggiungi tutti i nodi al grafo con dimensioni appropriate
    nodes.forEach((node) => {
      const nodeWidth = node.type === 'indicatorNode' ? 180 : 140;
      const nodeHeight = node.type === 'indicatorNode' ? 80 : 60;
      
      g.setNode(node.id, { 
        width: nodeWidth, 
        height: nodeHeight 
      });
    });

    // Aggiungi tutti gli archi
    edges.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });

    // Esegui il layout automatico
    dagre.layout(g);

    // Applica le posizioni calcolate ai nodi
    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = g.node(node.id);
      const nodeWidth = node.type === 'indicatorNode' ? 180 : 140;
      const nodeHeight = node.type === 'indicatorNode' ? 80 : 60;
      
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
      };
    });

    console.log(`[LAYOUT] Positioned ${layoutedNodes.length} nodes and ${edges.length} edges using Dagre`);
    
    return { 
      nodes: layoutedNodes, 
      edges 
    };
  }
}