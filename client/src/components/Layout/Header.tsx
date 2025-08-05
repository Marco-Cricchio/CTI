import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Header.module.css';

export const Header = ({ onAddNew }: { onAddNew: () => void }) => {
  const { user, logout } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.title}>Dashboard</h1>
        <div className={styles.userSection}>
          <button onClick={onAddNew} className={styles.newButton} data-cy="new-indicator-button">+ New Indicator</button>
          <span className={styles.welcome}>Welcome, {user?.email}</span>
          <button onClick={logout} className={styles.logoutBtn} data-cy="logout-button">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};