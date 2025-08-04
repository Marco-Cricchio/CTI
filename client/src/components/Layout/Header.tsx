import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Header.module.css';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.title}>Dashboard</h1>
        <div className={styles.userSection}>
          <span className={styles.welcome}>Welcome, {user?.email}</span>
          <button onClick={logout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};