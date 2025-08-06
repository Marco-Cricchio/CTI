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
  Node,
  Edge,
} from '@xyflow/react';
import { Link } from 'react-router-dom';
import '@xyflow/react/dist/style.css';
import { apiClient } from '../services/api';
import IndicatorNode from '../components/GraphNodes/IndicatorNode';
import TagNode from '../components/GraphNodes/TagNode';
import { GraphFilterPanel } from '../components/GraphFilterPanel/GraphFilterPanel';
import styles from './GraphExplorerPage.module.css';

const GraphExplorerPage: React.FC = () => {
  // Stati per gestire i dati originali e quelli visualizzati
  const [initialNodes, setInitialNodes] = useState<Node[]>([]);
  const [initialEdges, setInitialEdges] = useState<Edge[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  
  // Stati per il controllo di visibilità
  const [hiddenElementIds, setHiddenElementIds] = useState<Set<string>>(new Set());
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});

  // Definiamo i nostri tipi di nodi personalizzati
  const nodeTypes = useMemo(() => ({ 
    indicatorNode: IndicatorNode,
    tagNode: TagNode,
  }), []);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Helper function per trovare i nodi figli di un nodo
  const getNodeChildren = useCallback((nodeId: string, allEdges: Edge[]) => {
    const connectedEdges = allEdges.filter(edge => 
      edge.source === nodeId || edge.target === nodeId
    );
    
    const childNodes = new Set<string>();
    const childEdges = new Set<string>();
    
    connectedEdges.forEach(edge => {
      childEdges.add(edge.id);
      // Se il nodo è la sorgente, il target è un figlio
      if (edge.source === nodeId) {
        childNodes.add(edge.target);
      }
      // Se il nodo è il target, la sorgente è un figlio  
      if (edge.target === nodeId) {
        childNodes.add(edge.source);
      }
    });
    
    return { childNodes: Array.from(childNodes), childEdges: Array.from(childEdges) };
  }, []);

  // Handler per il click sui nodi - implementa expand/collapse
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const { childNodes, childEdges } = getNodeChildren(node.id, initialEdges);
    
    // Verifica se alcuni figli sono già nascosti
    const someChildrenHidden = childNodes.some(childId => hiddenElementIds.has(childId));
    
    const newHiddenIds = new Set(hiddenElementIds);
    
    if (someChildrenHidden) {
      // Espandi: rimuovi figli e archi dagli elementi nascosti
      childNodes.forEach(childId => newHiddenIds.delete(childId));
      childEdges.forEach(edgeId => newHiddenIds.delete(edgeId));
    } else {
      // Contrai: aggiungi figli e archi agli elementi nascosti
      childNodes.forEach(childId => newHiddenIds.add(childId));
      childEdges.forEach(edgeId => newHiddenIds.add(edgeId));
    }
    
    setHiddenElementIds(newHiddenIds);
  }, [getNodeChildren, initialEdges, hiddenElementIds]);

  // Aggiorna gli elementi visualizzati quando cambiano quelli nascosti
  useEffect(() => {
    const visibleNodes = initialNodes.filter(n => !hiddenElementIds.has(n.id));
    const visibleEdges = initialEdges.filter(e => !hiddenElementIds.has(e.id));
    
    setNodes(visibleNodes);
    setEdges(visibleEdges);
  }, [hiddenElementIds, initialNodes, initialEdges, setNodes, setEdges]);

  // Controllo globale: Contrai tutto (nascondi tutti gli indicatori)
  const handleCollapseAll = useCallback(() => {
    const newHiddenIds = new Set<string>();
    
    // Trova tutti gli indicatori (nodi figli) e i relativi archi
    initialNodes.forEach(node => {
      if (node.type === 'indicatorNode') {
        newHiddenIds.add(node.id);
      }
    });
    
    // Nascondi anche gli archi collegati agli indicatori
    initialEdges.forEach(edge => {
      const sourceNode = initialNodes.find(n => n.id === edge.source);
      const targetNode = initialNodes.find(n => n.id === edge.target);
      
      if (sourceNode?.type === 'indicatorNode' || targetNode?.type === 'indicatorNode') {
        newHiddenIds.add(edge.id);
      }
    });
    
    setHiddenElementIds(newHiddenIds);
  }, [initialNodes, initialEdges]);

  // Controllo globale: Espandi tutto (mostra tutti gli elementi)
  const handleExpandAll = useCallback(() => {
    setHiddenElementIds(new Set());
  }, []);

  const fetchGraphData = useCallback(async (filters = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Salva i filtri attivi per la persistenza
      setActiveFilters(filters);
      
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
      
      // Salva i dati originali e quelli visualizzati
      setInitialNodes(nodeData);
      setInitialEdges(edgeData);
      
      // Reset degli elementi nascosti quando si caricano nuovi dati
      setHiddenElementIds(new Set());
      
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
        activeFilters={activeFilters}
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
        
        {/* Graph Controls */}
        <div className={styles.graphControls}>
          <button 
            onClick={handleExpandAll}
            className={styles.controlButton}
            title="Show all nodes and connections"
          >
            🔍 Expand All
          </button>
          <button 
            onClick={handleCollapseAll}
            className={styles.controlButton}
            title="Show only tag nodes"
          >
            📁 Collapse All
          </button>
        </div>
      </div>
      <div className={styles.graphContainer}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
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