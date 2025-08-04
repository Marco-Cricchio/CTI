import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import api from '../../services/api';
import styles from './IndicatorTable.module.css';
import { toast } from 'react-hot-toast';

interface Indicator {
  id: string;
  value: string;
  type: string;
  threat_level: string;
}

export interface IndicatorTableHandles {
  refetch: () => void;
}

export const IndicatorTable = forwardRef<IndicatorTableHandles>((_props, ref) => {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIndicators = async () => {
    setLoading(true);
    try {
      const response = await api.get('/indicators');
      setIndicators(response.data);
    } catch (err) {
      toast.error('Failed to fetch indicators.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndicators();
  }, []);

  useImperativeHandle(ref, () => ({
    refetch() {
      fetchIndicators();
    }
  }));

  if (loading) return <div className={styles.container}>Loading indicators...</div>;
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Latest Indicators</h3>
        <button className={styles.viewAllBtn}>View All</button>
      </div>
      
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>IOC Value</th>
              <th>Type</th>
              <th>Threat Level</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            {indicators.map(indicator => (
              <tr key={indicator.id} className={styles.row}>
                <td className={styles.value}>{indicator.value}</td>
                <td className={styles.type}>{indicator.type}</td>
                <td>
                  <span className={`${styles.threatBadge} ${styles[indicator.threat_level]}`}>
                    {indicator.threat_level}
                  </span>
                </td>
                <td className={styles.date}>{indicator.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});