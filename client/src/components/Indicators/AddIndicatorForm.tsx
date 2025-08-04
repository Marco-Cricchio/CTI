// client/src/components/Indicators/AddIndicatorForm.tsx
import React, { useState } from 'react';
import styles from './AddIndicatorForm.module.css';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface AddIndicatorFormProps {
  onSuccess: () => void; // Callback per notificare il successo
}

export const AddIndicatorForm: React.FC<AddIndicatorFormProps> = ({ onSuccess }) => {
  const [value, setValue] = useState('');
  const [type, setType] = useState('ip');
  const [threatLevel, setThreatLevel] = useState('low');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) {
      toast.error('Indicator value cannot be empty.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/indicators', {
        value,
        type,
        threat_level: threatLevel,
      });
      toast.success('Indicator added successfully!');
      onSuccess(); // Chiama il callback
    } catch (error) {
      console.error('Failed to add indicator', error);
      toast.error('Failed to add indicator. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="value">Indicator Value</label>
        <input
          id="value"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g., 1.2.3.4 or malicious.com"
          disabled={isSubmitting}
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="type">Type</label>
        <select id="type" value={type} onChange={(e) => setType(e.target.value)} disabled={isSubmitting}>
          <option value="ip">IP Address</option>
          <option value="domain">Domain</option>
          <option value="url">URL</option>
          <option value="file_hash">File Hash</option>
          <option value="email">Email</option>
        </select>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="threat_level">Threat Level</label>
        <select id="threat_level" value={threatLevel} onChange={(e) => setThreatLevel(e.target.value)} disabled={isSubmitting}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Indicator'}
        </button>
      </div>
    </form>
  );
};