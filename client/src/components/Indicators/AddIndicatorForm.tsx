// client/src/components/Indicators/AddIndicatorForm.tsx
import React, { useState, useEffect } from 'react';
import styles from './AddIndicatorForm.module.css';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Indicator {
  id: string;
  value: string;
  type: string;
  threat_level: string;
}

interface AddIndicatorFormProps {
  onSuccess: () => void;
  indicatorToEdit?: Indicator | null; // Indicatore opzionale per la modalità modifica
}

export const AddIndicatorForm: React.FC<AddIndicatorFormProps> = ({ onSuccess, indicatorToEdit }) => {
  const [value, setValue] = useState('');
  const [type, setType] = useState('ip');
  const [threatLevel, setThreatLevel] = useState('low');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!indicatorToEdit;

  useEffect(() => {
    if (isEditMode && indicatorToEdit) {
      setValue(indicatorToEdit.value);
      setType(indicatorToEdit.type);
      setThreatLevel(indicatorToEdit.threat_level);
    }
  }, [isEditMode, indicatorToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) {
      toast.error('Indicator value cannot be empty.');
      return;
    }
    setIsSubmitting(true);
    
    const payload = { value, type, threat_level: threatLevel };

    try {
      if (isEditMode && indicatorToEdit) {
        await api.patch(`/indicators/${indicatorToEdit.id}`, payload);
        toast.success('Indicator updated successfully!');
      } else {
        await api.post('/indicators', payload);
        toast.success('Indicator added successfully!');
      }
      onSuccess();
    } catch (error) {
      console.error('Operation failed', error);
      toast.error('Operation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form} data-cy="indicator-form">
      <div className={styles.formGroup}>
        <label htmlFor="value">Indicator Value</label>
        <input
          id="value"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g., 1.2.3.4 or malicious.com"
          disabled={isSubmitting}
          data-cy="indicator-form-value"
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="type">Type</label>
        <select id="type" value={type} onChange={(e) => setType(e.target.value)} disabled={isSubmitting} data-cy="indicator-form-type">
          <option value="ip">IP Address</option>
          <option value="domain">Domain</option>
          <option value="url">URL</option>
          <option value="file_hash">File Hash</option>
          <option value="email">Email</option>
        </select>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="threat_level">Threat Level</label>
        <select id="threat_level" value={threatLevel} onChange={(e) => setThreatLevel(e.target.value)} disabled={isSubmitting} data-cy="indicator-form-threat-level">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton} disabled={isSubmitting} data-cy="indicator-form-submit">
          {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Indicator' : 'Add Indicator')}
        </button>
      </div>
    </form>
  );
};