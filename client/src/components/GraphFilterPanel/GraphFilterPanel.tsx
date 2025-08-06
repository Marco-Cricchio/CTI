// client/src/components/GraphFilterPanel/GraphFilterPanel.tsx
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { getTags } from '../../services/api';
import { Tag } from '../../types';
import styles from './GraphFilterPanel.module.css';

interface GraphFilters {
  threat_levels?: string[];
  tags?: string[];
  types?: string[];
}

interface GraphFilterPanelProps {
  onApplyFilters: (filters: GraphFilters) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const THREAT_LEVELS = [
  { value: 'low', label: 'Low', color: '#2563eb' },
  { value: 'medium', label: 'Medium', color: '#f97316' },
  { value: 'high', label: 'High', color: '#dc2626' },
  { value: 'critical', label: 'Critical', color: '#7c3aed' }
];

const INDICATOR_TYPES = [
  { value: 'ip', label: 'IP Address', icon: '🌐' },
  { value: 'domain', label: 'Domain', icon: '🔗' },
  { value: 'url', label: 'URL', icon: '📄' },
  { value: 'file_hash', label: 'File Hash', icon: '📋' },
  { value: 'email', label: 'Email', icon: '📧' }
];

export const GraphFilterPanel: React.FC<GraphFilterPanelProps> = ({ 
  onApplyFilters, 
  isOpen, 
  onToggle 
}) => {
  const [filters, setFilters] = useState<GraphFilters>({});
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tags = await getTags();
        setAvailableTags(tags);
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      }
    };

    fetchTags();
  }, []);

  const handleThreatLevelToggle = (level: string) => {
    setFilters(prev => {
      const currentLevels = prev.threat_levels || [];
      const newLevels = currentLevels.includes(level)
        ? currentLevels.filter(l => l !== level)
        : [...currentLevels, level];
      
      return { ...prev, threat_levels: newLevels.length > 0 ? newLevels : undefined };
    });
  };

  const handleTypeToggle = (type: string) => {
    setFilters(prev => {
      const currentTypes = prev.types || [];
      const newTypes = currentTypes.includes(type)
        ? currentTypes.filter(t => t !== type)
        : [...currentTypes, type];
      
      return { ...prev, types: newTypes.length > 0 ? newTypes : undefined };
    });
  };

  const handleTagsChange = (selectedOptions: any) => {
    const tagIds = selectedOptions ? selectedOptions.map((option: any) => option.value) : [];
    setFilters(prev => ({ 
      ...prev, 
      tags: tagIds.length > 0 ? tagIds : undefined 
    }));
  };

  const handleApplyFilters = async () => {
    setIsLoading(true);
    try {
      await onApplyFilters(filters);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilters = async () => {
    setFilters({});
    setIsLoading(true);
    try {
      await onApplyFilters({});
    } finally {
      setIsLoading(false);
    }
  };

  const getActiveFiltersCount = () => {
    return (filters.threat_levels?.length || 0) + 
           (filters.types?.length || 0) + 
           (filters.tags?.length || 0);
  };

  const tagOptions = availableTags.map(tag => ({
    value: tag.id,
    label: tag.name
  }));

  const selectedTagOptions = tagOptions.filter(option => 
    filters.tags?.includes(option.value)
  );

  return (
    <>
      {/* Filter Toggle Button */}
      <button onClick={onToggle} className={styles.toggleButton}>
        🔍 Filters {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
      </button>

      {/* Filter Panel */}
      <div className={`${styles.filterPanel} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <h3>Graph Filters</h3>
          <button onClick={onToggle} className={styles.closeButton}>✕</button>
        </div>

        <div className={styles.content}>
          {/* Threat Levels */}
          <div className={styles.filterSection}>
            <h4>Threat Levels</h4>
            <div className={styles.checkboxGrid}>
              {THREAT_LEVELS.map(level => (
                <label key={level.value} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={filters.threat_levels?.includes(level.value) || false}
                    onChange={() => handleThreatLevelToggle(level.value)}
                  />
                  <span 
                    className={styles.levelBadge} 
                    style={{ backgroundColor: level.color }}
                  >
                    {level.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Indicator Types */}
          <div className={styles.filterSection}>
            <h4>Indicator Types</h4>
            <div className={styles.checkboxGrid}>
              {INDICATOR_TYPES.map(type => (
                <label key={type.value} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={filters.types?.includes(type.value) || false}
                    onChange={() => handleTypeToggle(type.value)}
                  />
                  <span className={styles.typeLabel}>
                    {type.icon} {type.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className={styles.filterSection}>
            <h4>Tags</h4>
            <Select
              isMulti
              value={selectedTagOptions}
              onChange={handleTagsChange}
              options={tagOptions}
              placeholder="Select tags..."
              className={styles.select}
              classNamePrefix="select"
              styles={{
                control: (provided) => ({
                  ...provided,
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--text-tertiary)',
                  color: 'var(--text-primary)'
                }),
                menu: (provided) => ({
                  ...provided,
                  backgroundColor: 'var(--bg-secondary)',
                }),
                option: (provided, state) => ({
                  ...provided,
                  backgroundColor: state.isSelected 
                    ? 'var(--accent-blue)' 
                    : state.isFocused 
                    ? 'var(--bg-tertiary)' 
                    : 'transparent',
                  color: 'var(--text-primary)'
                })
              }}
            />
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button 
              onClick={handleApplyFilters} 
              disabled={isLoading}
              className={styles.applyButton}
            >
              {isLoading ? 'Applying...' : 'Apply Filters'}
            </button>
            <button 
              onClick={handleClearFilters} 
              disabled={isLoading}
              className={styles.clearButton}
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && <div className={styles.backdrop} onClick={onToggle} />}
    </>
  );
};