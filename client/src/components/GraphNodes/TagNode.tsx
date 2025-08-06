// client/src/components/GraphNodes/TagNode.tsx
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import styles from './GraphNodes.module.css';

interface TagNodeData {
  label: string;
}

interface TagNodeProps {
  data: TagNodeData;
}

const TagNode: React.FC<TagNodeProps> = ({ data }) => {
  return (
    <div className={styles.tagNode}>
      <Handle type="source" position={Position.Top} className={styles.handle} />
      <div className={styles.nodeContent}>
        <span className={styles.icon}>🏷️</span>
        <span className={styles.label}>{data.label}</span>
      </div>
      <Handle type="target" position={Position.Bottom} className={styles.handle} />
    </div>
  );
};

export default TagNode;