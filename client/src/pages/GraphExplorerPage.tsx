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
  const [animatingElementIds, setAnimatingElementIds] = useState<Set<string>>(new Set());
  const [expandingElementIds, setExpandingElementIds] = useState<Set<string>>(new Set());
  
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

  // Handler per il click sui nodi - implementa expand/collapse con animazione
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const { childNodes, childEdges } = getNodeChildren(node.id, initialEdges);
    const elementsToAnimate = [...childNodes, ...childEdges];
    
    // Verifica se alcuni figli sono già nascosti
    const someChildrenHidden = childNodes.some(childId => hiddenElementIds.has(childId));
    const isExpanding = someChildrenHidden;
    
    // Avvia animazione
    const newAnimatingIds = new Set(animatingElementIds);
    const newExpandingIds = new Set(expandingElementIds);
    
    elementsToAnimate.forEach(id => {
      newAnimatingIds.add(id);
      if (isExpanding) {
        newExpandingIds.add(id);
      } else {
        newExpandingIds.delete(id);
      }
    });
    
    setAnimatingElementIds(newAnimatingIds);
    setExpandingElementIds(newExpandingIds);
    
    // Ritarda il cambio di visibilità per permettere l'animazione
    setTimeout(() => {
      const newHiddenIds = new Set(hiddenElementIds);
      
      if (isExpanding) {
        // Espandi: rimuovi figli e archi dagli elementi nascosti
        childNodes.forEach(childId => newHiddenIds.delete(childId));
        childEdges.forEach(edgeId => newHiddenIds.delete(edgeId));
      } else {
        // Contrai: aggiungi figli e archi agli elementi nascosti
        childNodes.forEach(childId => newHiddenIds.add(childId));
        childEdges.forEach(edgeId => newHiddenIds.add(edgeId));
      }
      
      setHiddenElementIds(newHiddenIds);
      
      // Fine animazione dopo la transizione
      setTimeout(() => {
        const finalAnimatingIds = new Set(animatingElementIds);
        const finalExpandingIds = new Set(expandingElementIds);
        elementsToAnimate.forEach(id => {
          finalAnimatingIds.delete(id);
          finalExpandingIds.delete(id);
        });
        setAnimatingElementIds(finalAnimatingIds);
        setExpandingElementIds(finalExpandingIds);
      }, isExpanding ? 400 : 300);
      
    }, isExpanding ? 0 : 50); // Ritardo minimo per contrazione
    
  }, [getNodeChildren, initialEdges, hiddenElementIds, animatingElementIds, expandingElementIds]);

  // Aggiorna gli elementi visualizzati quando cambiano quelli nascosti
  useEffect(() => {
    const visibleNodes = initialNodes
      .filter(n => !hiddenElementIds.has(n.id))
      .map(node => {
        let animationClass = '';
        if (animatingElementIds.has(node.id)) {
          animationClass = expandingElementIds.has(node.id) ? 'animating' : 'collapsing';
        }
        return {
          ...node,
          className: `${node.className || ''} ${animationClass}`.trim()
        };
      });
      
    const visibleEdges = initialEdges
      .filter(e => !hiddenElementIds.has(e.id))
      .map(edge => {
        let animationClass = '';
        if (animatingElementIds.has(edge.id)) {
          animationClass = expandingElementIds.has(edge.id) ? 'animating' : 'collapsing';
        }
        return {
          ...edge,
          className: `${edge.className || ''} ${animationClass}`.trim()
        };
      });
    
    setNodes(visibleNodes);
    setEdges(visibleEdges);
  }, [hiddenElementIds, initialNodes, initialEdges, animatingElementIds, expandingElementIds, setNodes, setEdges]);

  // Controllo globale: Contrai tutto (nascondi tutti gli indicatori) con animazione
  const handleCollapseAll = useCallback(() => {
    const elementsToHide = new Set<string>();
    
    // Trova tutti gli indicatori (nodi figli) e i relativi archi
    initialNodes.forEach(node => {
      if (node.type === 'indicatorNode') {
        elementsToHide.add(node.id);
      }
    });
    
    // Nascondi anche gli archi collegati agli indicatori
    initialEdges.forEach(edge => {
      const sourceNode = initialNodes.find(n => n.id === edge.source);
      const targetNode = initialNodes.find(n => n.id === edge.target);
      
      if (sourceNode?.type === 'indicatorNode' || targetNode?.type === 'indicatorNode') {
        elementsToHide.add(edge.id);
      }
    });
    
    // Avvia animazione globale (contrazione)
    const newAnimatingIds = new Set(animatingElementIds);
    const newExpandingIds = new Set(expandingElementIds);
    Array.from(elementsToHide).forEach(id => {
      newAnimatingIds.add(id);
      newExpandingIds.delete(id); // Non è espansione
    });
    setAnimatingElementIds(newAnimatingIds);
    setExpandingElementIds(newExpandingIds);
    
    // Applica nascondimento con ritardo per animazione
    setTimeout(() => {
      setHiddenElementIds(elementsToHide);
      
      // Fine animazione
      setTimeout(() => {
        setAnimatingElementIds(new Set());
        setExpandingElementIds(new Set());
      }, 350);
    }, 100);
    
  }, [initialNodes, initialEdges, animatingElementIds, expandingElementIds]);

  // Controllo globale: Espandi tutto (mostra tutti gli elementi) con animazione
  const handleExpandAll = useCallback(() => {
    // Avvia animazione per elementi nascosti (espansione)
    const newAnimatingIds = new Set(hiddenElementIds);
    const newExpandingIds = new Set(hiddenElementIds);
    setAnimatingElementIds(newAnimatingIds);
    setExpandingElementIds(newExpandingIds);
    
    // Mostra tutti gli elementi immediatamente per espansione
    setTimeout(() => {
      setHiddenElementIds(new Set());
      
      // Fine animazione
      setTimeout(() => {
        setAnimatingElementIds(new Set());
        setExpandingElementIds(new Set());
      }, 450);
    }, 50);
    
  }, [hiddenElementIds]);

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
      
      // Reset degli elementi nascosti e animazioni quando si caricano nuovi dati
      setHiddenElementIds(new Set());
      setAnimatingElementIds(new Set());
      setExpandingElementIds(new Set());
      
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