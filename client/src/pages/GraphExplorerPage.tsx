// client/src/pages/GraphExplorerPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { apiClient } from '../services/api';
import styles from './GraphExplorerPage.module.css';

const GraphExplorerPage: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get('/graph');
        const { nodes: nodeData, edges: edgeData } = response.data;
        
        // Personalizza gli stili dei nodi in base al tipo
        const styledNodes = nodeData.map((node: Node) => ({
          ...node,
          style: node.type === 'indicatorNode' ? {
            background: 'var(--accent-blue)',
            color: 'white',
            border: '1px solid var(--text-tertiary)',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '12px',
          } : {
            background: 'var(--accent-orange)',
            color: 'white',
            border: '1px solid var(--text-tertiary)',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '12px',
          }
        }));

        setNodes(styledNodes);
        setEdges(edgeData);
      } catch (error) {
        console.error('Failed to fetch graph data:', error);
        setError('Failed to load graph data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGraphData();
  }, [setNodes, setEdges]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading Graph Explorer...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Graph Explorer</h1>
        <div className={styles.stats}>
          <span className={styles.stat}>
            Nodes: {nodes.length}
          </span>
          <span className={styles.stat}>
            Edges: {edges.length}
          </span>
        </div>
      </div>
      <div className={styles.graphContainer}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          attributionPosition="bottom-left"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--text-tertiary)" />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};

export default GraphExplorerPage;