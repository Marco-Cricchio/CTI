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
  activeFilters?: GraphFilters;
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
  onToggle,
  activeFilters = {}
}) => {
  const [filters, setFilters] = useState<GraphFilters>(activeFilters);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sincronizza i filtri locali con i filtri attivi
  useEffect(() => {
    setFilters(activeFilters);
  }, [activeFilters]);

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
      // Non chiudere il pannello dopo l'applicazione dei filtri
      // in modo che l'utente possa vedere i filtri applicati
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
              menuPortalTarget={document.body}
              menuPosition="fixed"
              menuPlacement="auto"
              maxMenuHeight={200}
              styles={{
                control: (provided) => ({
                  ...provided,
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--text-tertiary)',
                  color: 'var(--text-primary)'
                }),
                menuPortal: (provided) => ({
                  ...provided,
                  zIndex: 9999
                }),
                menu: (provided) => ({
                  ...provided,
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--text-tertiary)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                  borderRadius: '6px'
                }),
                menuList: (provided) => ({
                  ...provided,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  padding: '4px 0'
                }),
                option: (provided, state) => ({
                  ...provided,
                  backgroundColor: state.isSelected 
                    ? 'var(--accent-blue)' 
                    : state.isFocused 
                    ? 'var(--bg-tertiary)' 
                    : 'transparent',
                  color: 'var(--text-primary)',
                  padding: '8px 12px',
                  cursor: 'pointer'
                }),
                multiValue: (provided) => ({
                  ...provided,
                  backgroundColor: 'var(--accent-blue)',
                  borderRadius: '4px'
                }),
                multiValueLabel: (provided) => ({
                  ...provided,
                  color: 'white',
                  fontSize: '0.875rem'
                }),
                multiValueRemove: (provided) => ({
                  ...provided,
                  color: 'white',
                  ':hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white'
                  }
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