import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './LoginPage.module.css';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <h1>CyberForge Sentinel</h1>
        <p className={styles.subtitle}>Threat Intelligence Platform</p>
        
        <form onSubmit={handleLogin} className={styles.loginForm} data-cy="login-form">
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cyberforge.local"
              required
              data-cy="email-input"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              data-cy="password-input"
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.loginBtn}
            disabled={isLoading}
            data-cy="login-button"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};