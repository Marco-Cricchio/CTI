import React from 'react';
import styles from './Sidebar.module.css';

export const Sidebar: React.FC = () => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <h2>CyberForge Sentinel</h2>
      </div>
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          <li className={`${styles.navItem} ${styles.active}`}>
            <span>📊 Dashboard</span>
          </li>
          <li className={styles.navItem}>
            <span>🔍 Indicators</span>
          </li>
          <li className={styles.navItem}>
            <span>📋 Investigations</span>
          </li>
          <li className={styles.navItem}>
            <span>📄 Reports</span>
          </li>
          <li className={styles.navItem}>
            <span>🚨 Alerts</span>
          </li>
          <li className={styles.navItem}>
            <span>⚙️ Settings</span>
          </li>
        </ul>
      </nav>
    </aside>
  );
};