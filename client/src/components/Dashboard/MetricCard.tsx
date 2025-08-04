import React from 'react';
import styles from './MetricCard.module.css';

interface MetricCardProps {
  title: string;
  value: string | number | undefined;
  trend?: 'up' | 'down' | 'stable';
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, trend }) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
      </div>
      <div className={styles.content}>
        <div className={styles.value}>{value ?? '0'}</div>
        {trend && (
          <div className={`${styles.trend} ${styles[trend]}`}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
          </div>
        )}
      </div>
    </div>
  );
};