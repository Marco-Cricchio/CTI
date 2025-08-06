// client/src/components/Indicators/IndicatorDetailPanel.tsx
import React, { useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { motion, AnimatePresence } from 'framer-motion';
import { Indicator, Tag } from '../../types';
import { indicatorService, updateIndicatorTags } from '../../services/api';
import { IpGeolocationMap } from './IpGeolocationMap';
import TagManager from '../TagManager/TagManager';
import styles from './IndicatorDetailPanel.module.css';

interface Props {
  indicator: Indicator | null;
  onClose: () => void;
}

export const IndicatorDetailPanel: React.FC<Props> = ({ indicator, onClose }) => {
  const [detailedIndicator, setDetailedIndicator] = useState<Indicator | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [savingTags, setSavingTags] = useState(false);

  useEffect(() => {
    const fetchDetailedIndicator = async () => {
      if (!indicator) {
        setDetailedIndicator(null);
        return;
      }

      setLoading(true);
      try {
        const detailed = await indicatorService.getById(indicator.id);
        setDetailedIndicator(detailed);
      } catch (error) {
        console.error('Failed to fetch detailed indicator:', error);
        setDetailedIndicator(indicator); // Fallback to basic data
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedIndicator();
  }, [indicator]);

  if (!indicator) {
    return null;
  }

  const displayIndicator = detailedIndicator || indicator;

  const getThreatLevelColor = (level: string) => {
    const colors = {
      low: 'var(--success-color)',
      medium: 'var(--warning-color)',
      high: 'var(--accent-orange)',
      critical: 'var(--danger-color)',
    };
    return colors[level as keyof typeof colors] || 'var(--text-secondary)';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleEditTags = () => {
    setSelectedTags(displayIndicator.tags || []);
    setIsEditingTags(true);
  };

  const handleCancelEditTags = () => {
    setIsEditingTags(false);
    setSelectedTags([]);
  };

  const handleSaveTags = async () => {
    if (!displayIndicator) return;
    
    setSavingTags(true);
    try {
      const tagIds = selectedTags.map(tag => tag.id);
      const updatedIndicator = await updateIndicatorTags(displayIndicator.id, tagIds);
      
      // Update the local state
      setDetailedIndicator(updatedIndicator);
      setIsEditingTags(false);
      setSelectedTags([]);
    } catch (error) {
      console.error('Failed to update tags:', error);
    } finally {
      setSavingTags(false);
    }
  };

  const handleTagsChange = (tags: Tag[]) => {
    setSelectedTags(tags);
  };

  return (
    <AnimatePresence>
      {indicator && (
        <>
          {/* Animated Overlay */}
          <motion.div
            className={styles.overlay}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Animated Panel */}
          <motion.div
            className={styles.panelContainer}
            onClick={(e) => e.stopPropagation()}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 30,
              mass: 0.8
            }}
          >
            <PanelGroup
              direction="horizontal"
              className="h-full"
            >
        <Panel defaultSize={100} minSize={30}>
          <div className={styles.content}>
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.titleSection}>
                <h2 className={styles.title}>
                  {displayIndicator.value}
                </h2>
                <div className={styles.badges}>
                  <span className={styles.typeBadge}>{displayIndicator.type.toUpperCase()}</span>
                  <span 
                    className={styles.threatBadge}
                    style={{ 
                      backgroundColor: getThreatLevelColor(displayIndicator.threat_level),
                      color: 'white'
                    }}
                  >
                    {displayIndicator.threat_level.toUpperCase()}
                  </span>
                </div>
              </div>
              <button onClick={onClose} className={styles.closeButton}>
                ✕
              </button>
            </div>

            {loading && (
              <div className={styles.loadingIndicator}>
                Loading detailed information...
              </div>
            )}

            {/* Basic Information Section */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Basic Information</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>IOC Value:</label>
                  <span>{displayIndicator.value}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Type:</label>
                  <span>{displayIndicator.type}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Threat Level:</label>
                  <span style={{ color: getThreatLevelColor(displayIndicator.threat_level) }}>
                    {displayIndicator.threat_level}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <label>Status:</label>
                  <span className={displayIndicator.is_active ? styles.active : styles.inactive}>
                    {displayIndicator.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <label>First Seen:</label>
                  <span>{formatDate(displayIndicator.first_seen)}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Last Seen:</label>
                  <span>{formatDate(displayIndicator.last_seen)}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Created By:</label>
                  <span>{displayIndicator.created_by?.email || 'Unknown'}</span>
                </div>
              </div>
            </section>

            {/* Tags Section */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Tags</h3>
                {!isEditingTags && (
                  <button 
                    onClick={handleEditTags}
                    className={styles.editButton}
                  >
                    Edit
                  </button>
                )}
              </div>
              
              {isEditingTags ? (
                <div className={styles.tagEditContainer}>
                  <TagManager
                    initialTags={displayIndicator.tags || []}
                    onChange={handleTagsChange}
                  />
                  <div className={styles.tagEditButtons}>
                    <button 
                      onClick={handleSaveTags}
                      disabled={savingTags}
                      className={styles.saveButton}
                    >
                      {savingTags ? 'Saving...' : 'Save'}
                    </button>
                    <button 
                      onClick={handleCancelEditTags}
                      disabled={savingTags}
                      className={styles.cancelButton}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.tagsContainer}>
                  {displayIndicator.tags && displayIndicator.tags.length > 0 ? (
                    displayIndicator.tags.map((tag) => (
                      <span key={tag.id} className={styles.tagPill}>
                        {tag.name}
                      </span>
                    ))
                  ) : (
                    <span className={styles.noTags}>No tags assigned</span>
                  )}
                </div>
              )}
            </section>

            {/* IP Enrichment Section */}
            {displayIndicator.type === 'ip' && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>IP Intelligence Data</h3>
                
                {displayIndicator.country_code || displayIndicator.isp || displayIndicator.abuse_score !== null ? (
                  <div className={styles.enrichmentGrid}>
                    {displayIndicator.country_code && (
                      <div className={styles.enrichmentItem}>
                        <label>Country:</label>
                        <span className={styles.countryCode}>
                          {displayIndicator.country_code}
                        </span>
                      </div>
                    )}
                    
                    {displayIndicator.isp && (
                      <div className={styles.enrichmentItem}>
                        <label>ISP:</label>
                        <span>{displayIndicator.isp}</span>
                      </div>
                    )}
                    
                    {displayIndicator.abuse_score !== null && (
                      <div className={styles.enrichmentItem}>
                        <label>Abuse Score:</label>
                        <span className={styles.abuseScore}>
                          {displayIndicator.abuse_score}%
                          <div className={styles.scoreBar}>
                            <div 
                              className={styles.scoreProgress}
                              style={{ 
                                width: `${displayIndicator.abuse_score || 0}%`,
                                backgroundColor: (displayIndicator.abuse_score || 0) > 75 ? 'var(--danger-color)' :
                                                 (displayIndicator.abuse_score || 0) > 50 ? 'var(--accent-orange)' :
                                                 (displayIndicator.abuse_score || 0) > 25 ? 'var(--warning-color)' :
                                                 'var(--success-color)'
                              }}
                            />
                          </div>
                        </span>
                      </div>
                    )}
                    
                    {displayIndicator.domain_usage && (
                      <div className={styles.enrichmentItem}>
                        <label>Domain Usage:</label>
                        <span>{displayIndicator.domain_usage}</span>
                      </div>
                    )}
                    
                    {(displayIndicator.latitude && displayIndicator.longitude) && (
                      <div className={styles.enrichmentItem}>
                        <label>Geolocation:</label>
                        <span>
                          {displayIndicator.latitude?.toFixed(4)}, {displayIndicator.longitude?.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.noEnrichment}>
                    <div className={styles.enrichmentPlaceholder}>
                      <div className={styles.loadingIcon}>⏳</div>
                      <p>IP enrichment data is being processed...</p>
                      <small>This may take a few moments for new indicators</small>
                    </div>
                  </div>
                )}

                {/* Interactive Map */}
                {(displayIndicator.latitude && displayIndicator.longitude) ? (
                  <div className={styles.mapSection}>
                    <h4 className={styles.mapTitle}>Geographic Location</h4>
                    <div className={styles.mapContainer}>
                      <IpGeolocationMap
                        latitude={displayIndicator.latitude}
                        longitude={displayIndicator.longitude}
                        isp={displayIndicator.isp || undefined}
                        countryCode={displayIndicator.country_code || undefined}
                        ipAddress={displayIndicator.value}
                      />
                    </div>
                  </div>
                ) : displayIndicator.type === 'ip' && (
                  <div className={styles.mapSection}>
                    <h4 className={styles.mapTitle}>Geographic Location</h4>
                    <div className={styles.mapPlaceholder}>
                      <p>Location data will appear here after enrichment</p>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
            </Panel>
            <PanelResizeHandle className={styles.resizeHandle} />
            </PanelGroup>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};