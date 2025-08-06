// client/src/pages/GraphExplorerPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
} from '@xyflow/react';
import { Link } from 'react-router-dom';
import '@xyflow/react/dist/style.css';
import { apiClient } from '../services/api';
import IndicatorNode from '../components/GraphNodes/IndicatorNode';
import TagNode from '../components/GraphNodes/TagNode';
import { GraphFilterPanel } from '../components/GraphFilterPanel/GraphFilterPanel';
import styles from './GraphExplorerPage.module.css';

const GraphExplorerPage: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Definiamo i nostri tipi di nodi personalizzati
  const nodeTypes = useMemo(() => ({ 
    indicatorNode: IndicatorNode,
    tagNode: TagNode,
  }), []);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const fetchGraphData = useCallback(async (filters = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Costruisci i parametri di query
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          value.forEach(v => params.append(key, v));
        }
      });
      
      const queryString = params.toString();
      const url = queryString ? `/graph?${queryString}` : '/graph';
      
      const response = await apiClient.get(url);
      const { nodes: nodeData, edges: edgeData } = response.data;
      
      // I nodi personalizzati non hanno bisogno di stili inline
      setNodes(nodeData);
      setEdges(edgeData);
    } catch (error) {
      console.error('Failed to fetch graph data:', error);
      setError('Failed to load graph data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    fetchGraphData(); // Chiamata iniziale senza filtri
  }, [fetchGraphData]);

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
      {/* Filter Panel */}
      <GraphFilterPanel
        onApplyFilters={fetchGraphData}
        isOpen={isFilterPanelOpen}
        onToggle={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
      />

      <div className={styles.header}>
        {/* Back Button */}
        <Link to="/" className={styles.backButtonHeader}>
          ← Back to Dashboard
        </Link>
        
        {/* Centered Stats */}
        <div className={styles.centerSection}>
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
        
        {/* Spacer for alignment */}
        <div className={styles.spacer}></div>
      </div>
      <div className={styles.graphContainer}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
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