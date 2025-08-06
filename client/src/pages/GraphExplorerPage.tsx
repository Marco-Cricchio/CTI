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
  const [currentLayout, setCurrentLayout] = useState<string>('hierarchical');

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

  // Handler per il click sui nodi - logica corretta per expand/collapse
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const { childNodes } = getNodeChildren(node.id, initialEdges);
    
    if (node.type === 'indicatorNode') {
      // INDICATORI NON SPARISCONO MAI - gestiscono solo i loro tag collegati
      const connectedTags = childNodes.filter(childId => {
        const childNode = initialNodes.find(n => n.id === childId);
        return childNode?.type === 'tagNode';
      });
      
      if (connectedTags.length === 0) {
        // Se l'indicatore non ha tag, non fare nulla
        return;
      }
      
      // Verifica se alcuni tag sono già nascosti
      const someTagsHidden = connectedTags.some(tagId => hiddenElementIds.has(tagId));
      const isExpanding = someTagsHidden;
      
      // Per ogni tag connesso, verifica se ha altre connessioni visibili
      let tagsToToggle = [];
      if (isExpanding) {
        // Espandi: mostra tutti i tag collegati a questo indicatore
        tagsToToggle = connectedTags;
      } else {
        // Contrai: nascondi solo i tag che non hanno altre connessioni visibili
        tagsToToggle = connectedTags.filter(tagId => {
          const { childNodes: tagChildren } = getNodeChildren(tagId, initialEdges);
          const visibleIndicators = tagChildren.filter(indicatorId => 
            !hiddenElementIds.has(indicatorId) && indicatorId !== node.id
          );
          return visibleIndicators.length === 0; // Nascondi solo se non ha altre connessioni visibili
        });
      }
      
      if (tagsToToggle.length === 0) {
        // Nessun tag da modificare (tutti condivisi)
        return;
      }
      
      // Archi da nascondere/mostrare: quelli che collegano l'indicatore ai tag
      const edgesToToggle = initialEdges
        .filter(edge => 
          (edge.source === node.id && tagsToToggle.includes(edge.target)) ||
          (edge.target === node.id && tagsToToggle.includes(edge.source))
        )
        .map(edge => edge.id);
      
      const elementsToAnimate = [...tagsToToggle, ...edgesToToggle];
      
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
      
      // Applica il cambio di visibilità
      setTimeout(() => {
        const newHiddenIds = new Set(hiddenElementIds);
        
        if (isExpanding) {
          elementsToAnimate.forEach(id => newHiddenIds.delete(id));
        } else {
          elementsToAnimate.forEach(id => newHiddenIds.add(id));
        }
        
        setHiddenElementIds(newHiddenIds);
        
        // Fine animazione
        setTimeout(() => {
          const finalAnimatingIds = new Set(animatingElementIds);
          const finalExpandingIds = new Set(expandingElementIds);
          elementsToAnimate.forEach(id => {
            finalAnimatingIds.delete(id);
            finalExpandingIds.delete(id);
          });
          setAnimatingElementIds(finalAnimatingIds);
          setExpandingElementIds(finalExpandingIds);
        }, isExpanding ? 500 : 400);
      }, isExpanding ? 0 : 50);
      
    } else if (node.type === 'tagNode') {
      // I TAG gestiscono solo i loro indicatori collegati
      const connectedIndicators = childNodes.filter(childId => {
        const childNode = initialNodes.find(n => n.id === childId);
        return childNode?.type === 'indicatorNode';
      });
      
      if (connectedIndicators.length === 0) {
        return; // Nessun indicatore collegato
      }
      
      const someIndicatorsHidden = connectedIndicators.some(indicatorId => hiddenElementIds.has(indicatorId));
      const isExpanding = someIndicatorsHidden;
      
      // Archi da gestire
      const edgesToToggle = initialEdges
        .filter(edge => 
          (edge.source === node.id && connectedIndicators.includes(edge.target)) ||
          (edge.target === node.id && connectedIndicators.includes(edge.source))
        )
        .map(edge => edge.id);
      
      const elementsToAnimate = [...connectedIndicators, ...edgesToToggle];
      
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
      
      // Applica il cambio di visibilità
      setTimeout(() => {
        const newHiddenIds = new Set(hiddenElementIds);
        
        if (isExpanding) {
          elementsToAnimate.forEach(id => newHiddenIds.delete(id));
        } else {
          elementsToAnimate.forEach(id => newHiddenIds.add(id));
        }
        
        setHiddenElementIds(newHiddenIds);
        
        // Fine animazione
        setTimeout(() => {
          const finalAnimatingIds = new Set(animatingElementIds);
          const finalExpandingIds = new Set(expandingElementIds);
          elementsToAnimate.forEach(id => {
            finalAnimatingIds.delete(id);
            finalExpandingIds.delete(id);
          });
          setAnimatingElementIds(finalAnimatingIds);
          setExpandingElementIds(finalExpandingIds);
        }, isExpanding ? 500 : 400);
      }, isExpanding ? 0 : 50);
    }
    
  }, [getNodeChildren, initialEdges, initialNodes, hiddenElementIds, animatingElementIds, expandingElementIds]);

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

  // Controllo globale: Contrai tutti gli indicatori (mantieni solo tag)
  const handleCollapseAll = useCallback(() => {
    const elementsToHide = new Set<string>();
    
    // Trova solo i TAG che devono essere nascosti quando si contraggono gli indicatori
    initialNodes.forEach(node => {
      if (node.type === 'tagNode') {
        // Nascondi i tag che sono connessi SOLO ad indicatori (non condivisi)
        const { childNodes } = getNodeChildren(node.id, initialEdges);
        const connectedIndicators = childNodes.filter(childId => {
          const childNode = initialNodes.find(n => n.id === childId);
          return childNode?.type === 'indicatorNode';
        });
        
        // Se il tag ha solo connessioni agli indicatori (nessun altro tipo), nascondilo
        if (connectedIndicators.length === childNodes.length && connectedIndicators.length > 0) {
          elementsToHide.add(node.id);
        }
      }
    });
    
    // Nascondi anche gli archi collegati ai tag nascosti e agli indicatori
    initialEdges.forEach(edge => {
      const sourceNode = initialNodes.find(n => n.id === edge.source);
      const targetNode = initialNodes.find(n => n.id === edge.target);
      
      if (elementsToHide.has(edge.source) || elementsToHide.has(edge.target) ||
          sourceNode?.type === 'indicatorNode' || targetNode?.type === 'indicatorNode') {
        elementsToHide.add(edge.id);
      }
    });
    
    // Avvia animazione globale (contrazione)
    const newAnimatingIds = new Set(animatingElementIds);
    const newExpandingIds = new Set(expandingElementIds);
    Array.from(elementsToHide).forEach(id => {
      newAnimatingIds.add(id);
      newExpandingIds.delete(id);
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
      }, 450);
    }, 100);
    
  }, [initialNodes, initialEdges, animatingElementIds, expandingElementIds, getNodeChildren]);

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
      }, 550);
    }, 50);
    
  }, [hiddenElementIds]);

  const fetchGraphData = useCallback(async (filters = {}, layout = currentLayout) => {
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
      
      // Aggiungi il layout ai parametri
      params.set('layout', layout);
      
      const queryString = params.toString();
      const url = `/graph?${queryString}`;
      
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
  }, [setNodes, setEdges, currentLayout]);

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
          <select 
            value={currentLayout}
            onChange={(e) => {
              setCurrentLayout(e.target.value);
              fetchGraphData(activeFilters, e.target.value);
            }}
            className={styles.layoutSelect}
            title="Choose graph layout"
          >
            <option value="hierarchical">📊 Hierarchical</option>
            <option value="radial">🎯 Radial</option>
            <option value="circular">⭕ Circular</option>
            <option value="concentric">🔘 Concentric</option>
            <option value="grid">⬜ Grid</option>
            <option value="force">⚡ Force</option>
          </select>
          <button 
            onClick={handleExpandAll}
            className={styles.controlButton}
            title="Show all connections to indicators"
          >
            🔍 Expand All
          </button>
          <button 
            onClick={handleCollapseAll}
            className={styles.controlButton}
            title="Hide non-shared connections"
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