import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <h2>CyberForge Sentinel</h2>
      </div>
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          <li className={`${styles.navItem} ${location.pathname === '/' ? styles.active : ''}`}>
            <Link to="/">📊 Dashboard</Link>
          </li>
          <li className={styles.navItem}>
            <span>🔍 Indicators</span>
          </li>
          <li className={`${styles.navItem} ${location.pathname === '/graph' ? styles.active : ''}`}>
            <Link to="/graph">🕸️ Graph Explorer</Link>
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