import React from 'react';
import styles from './IndicatorTable.module.css';

interface Indicator {
  id: string;
  value: string;
  type: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  firstSeen: string;
  source: string;
}

const mockIndicators: Indicator[] = [
  {
    id: '1',
    value: '192.168.1.100',
    type: 'IP',
    threatLevel: 'high',
    firstSeen: '2025-01-04 14:30:15',
    source: 'VirusTotal'
  },
  {
    id: '2',
    value: 'malicious.example.com',
    type: 'Domain',
    threatLevel: 'critical',
    firstSeen: '2025-01-04 13:45:22',
    source: 'AlienVault'
  },
  {
    id: '3',
    value: 'c4b2e5f8a9d7e3c1',
    type: 'Hash',
    threatLevel: 'medium',
    firstSeen: '2025-01-04 12:20:10',
    source: 'Internal'
  }
];

export const IndicatorTable: React.FC = () => {
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
              <th>First Seen</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {mockIndicators.map(indicator => (
              <tr key={indicator.id} className={styles.row}>
                <td className={styles.value}>{indicator.value}</td>
                <td className={styles.type}>{indicator.type}</td>
                <td>
                  <span className={`${styles.threatBadge} ${styles[indicator.threatLevel]}`}>
                    {indicator.threatLevel}
                  </span>
                </td>
                <td className={styles.date}>{indicator.firstSeen}</td>
                <td className={styles.source}>{indicator.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};