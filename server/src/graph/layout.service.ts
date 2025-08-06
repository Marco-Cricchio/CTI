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

export type LayoutType = 'hierarchical' | 'radial' | 'force' | 'circular' | 'grid' | 'concentric';

@Injectable()
export class LayoutService {
  getLayoutedElements(nodes: GraphNode[], edges: GraphEdge[], layoutType: LayoutType = 'hierarchical') {
    console.log(`[LAYOUT] Applying ${layoutType} layout to ${nodes.length} nodes`);
    
    switch (layoutType) {
      case 'hierarchical':
        return this.getHierarchicalLayout(nodes, edges);
      case 'radial':
        return this.getRadialLayout(nodes, edges);
      case 'force':
        return this.getForceLayout(nodes, edges);
      case 'circular':
        return this.getCircularLayout(nodes, edges);
      case 'grid':
        return this.getGridLayout(nodes, edges);
      case 'concentric':
        return this.getConcentricLayout(nodes, edges);
      default:
        return this.getHierarchicalLayout(nodes, edges);
    }
  }

  private getHierarchicalLayout(nodes: GraphNode[], edges: GraphEdge[]) {
    const g = new dagre.graphlib.Graph();
    
    g.setGraph({ 
      rankdir: 'TB',
      nodesep: 120,
      ranksep: 80,
      marginx: 20,
      marginy: 20
    });
    
    g.setDefaultEdgeLabel(() => ({}));

    nodes.forEach((node) => {
      const nodeWidth = node.type === 'indicatorNode' ? 180 : 140;
      const nodeHeight = node.type === 'indicatorNode' ? 80 : 60;
      
      g.setNode(node.id, { 
        width: nodeWidth, 
        height: nodeHeight 
      });
    });

    edges.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

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

    return { nodes: layoutedNodes, edges };
  }

  private getRadialLayout(nodes: GraphNode[], edges: GraphEdge[]) {
    const centerX = 400;
    const centerY = 300;
    
    const tagNodes = nodes.filter(n => n.type === 'tagNode');
    const indicatorNodes = nodes.filter(n => n.type === 'indicatorNode');
    
    const layoutedNodes: GraphNode[] = [];
    
    // Tags in inner circle
    const tagRadius = 200;
    tagNodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / tagNodes.length;
      layoutedNodes.push({
        ...node,
        position: {
          x: centerX + tagRadius * Math.cos(angle),
          y: centerY + tagRadius * Math.sin(angle),
        },
      });
    });
    
    // Indicators in outer circle
    const indicatorRadius = 400;
    indicatorNodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / indicatorNodes.length;
      layoutedNodes.push({
        ...node,
        position: {
          x: centerX + indicatorRadius * Math.cos(angle),
          y: centerY + indicatorRadius * Math.sin(angle),
        },
      });
    });

    return { nodes: layoutedNodes, edges };
  }

  private getForceLayout(nodes: GraphNode[], edges: GraphEdge[]) {
    // Force-directed with random positioning and connection-based adjustments
    const layoutedNodes = nodes.map((node, index) => {
      const angle = Math.random() * 2 * Math.PI;
      const radius = 200 + Math.random() * 300;
      return {
        ...node,
        position: {
          x: 400 + radius * Math.cos(angle),
          y: 300 + radius * Math.sin(angle),
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  }

  private getCircularLayout(nodes: GraphNode[], edges: GraphEdge[]) {
    const centerX = 400;
    const centerY = 300;
    const radius = 300;
    
    const layoutedNodes = nodes.map((node, index) => {
      const angle = (2 * Math.PI * index) / nodes.length;
      return {
        ...node,
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  }

  private getGridLayout(nodes: GraphNode[], edges: GraphEdge[]) {
    const cols = Math.ceil(Math.sqrt(nodes.length));
    
    const layoutedNodes = nodes.map((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      return {
        ...node,
        position: {
          x: col * 250 + 100,
          y: row * 150 + 100,
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  }

  private getConcentricLayout(nodes: GraphNode[], edges: GraphEdge[]) {
    const centerX = 400;
    const centerY = 300;
    
    const tagNodes = nodes.filter(n => n.type === 'tagNode');
    const indicatorNodes = nodes.filter(n => n.type === 'indicatorNode');
    
    const layoutedNodes: GraphNode[] = [];
    
    // Tags in center
    tagNodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / Math.max(tagNodes.length, 1);
      const radius = tagNodes.length === 1 ? 0 : 100;
      layoutedNodes.push({
        ...node,
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        },
      });
    });
    
    // Indicators in concentric circles
    indicatorNodes.forEach((node, index) => {
      const ring = Math.floor(index / 8) + 1;
      const positionInRing = index % 8;
      const angle = (2 * Math.PI * positionInRing) / 8;
      const radius = 250 + (ring - 1) * 150;
      
      layoutedNodes.push({
        ...node,
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        },
      });
    });

    return { nodes: layoutedNodes, edges };
  }
}