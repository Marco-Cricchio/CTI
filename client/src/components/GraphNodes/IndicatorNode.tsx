// client/src/components/GraphNodes/IndicatorNode.tsx
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import styles from './GraphNodes.module.css';

const getThreatLevelColor = (level: string) => {
  const colors = {
    low: '#2563eb', // Blu
    medium: '#f97316', // Arancione
    high: '#dc2626', // Rosso
    critical: '#7c3aed', // Viola
  };
  return colors[level as keyof typeof colors] || '#4b5563'; // Grigio default
};

const getIndicatorIcon = (type: string) => {
  const icons = {
    ip: '🌐',
    domain: '🔗',
    url: '📄',
    file_hash: '📋',
    email: '📧'
  };
  return icons[type as keyof typeof icons] || '📄';
};

interface IndicatorNodeData {
  label: string;
  type: string;
  threat_level: string;
}

interface IndicatorNodeProps {
  data: IndicatorNodeData;
}

const IndicatorNode: React.FC<IndicatorNodeProps> = ({ data }) => {
  const icon = getIndicatorIcon(data.type);
  const threatColor = getThreatLevelColor(data.threat_level);
  
  return (
    <div className={styles.indicatorNode} style={{ borderColor: threatColor }}>
      <Handle type="source" position={Position.Top} className={styles.handle} />
      
      {/* Main content area */}
      <div className={styles.nodeHeader}>
        <div className={styles.nodeContent}>
          <span className={styles.icon}>{icon}</span>
          <span className={styles.label}>{data.label}</span>
        </div>
        {/* Prominent severity badge inside the node */}
        <div className={styles.severityBadge} style={{ backgroundColor: threatColor }}>
          {data.threat_level.toUpperCase()}
        </div>
      </div>
      
      <Handle type="target" position={Position.Bottom} className={styles.handle} />
    </div>
  );
};

export default IndicatorNode;