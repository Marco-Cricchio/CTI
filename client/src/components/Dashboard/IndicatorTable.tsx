import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { indicatorService } from '../../services/api';
import { Indicator } from '../../types';
import styles from './IndicatorTable.module.css';
import { toast } from 'react-hot-toast';
import { Pagination } from '../shared/Pagination';

export interface IndicatorTableHandles {
  refetch: () => void;
}

interface IndicatorTableProps {
  onDeleteSuccess: () => void;
  onEdit: (indicator: Indicator) => void;
  onRowClick?: (indicator: Indicator) => void;
}

export const IndicatorTable = forwardRef<IndicatorTableHandles, IndicatorTableProps>(({ onDeleteSuccess, onEdit, onRowClick }, ref) => {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({ type: '', threat_level: '' });
  const itemsPerPage = 10;

  const fetchIndicators = useCallback(async () => {
    setLoading(true);

    // CORREZIONE: Costruisci i parametri dinamicamente
    const params: any = {
      page: currentPage,
      limit: itemsPerPage,
    };
    if (filters.type) {
      params.type = filters.type;
    }
    if (filters.threat_level) {
      params.threat_level = filters.threat_level;
    }

    try {
      const response = await indicatorService.getAll(params);
      setIndicators(response.data || []);
      setTotalItems(response.total || 0);
    } catch (err) {
      toast.error('Failed to fetch indicators.');
      setIndicators([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchIndicators();
  }, [fetchIndicators]);

  useImperativeHandle(ref, () => ({
    refetch() {
      fetchIndicators();
    }
  }));

  const handleDelete = async (indicatorId: string) => {
    if (window.confirm('Are you sure you want to delete this indicator?')) {
      try {
        await indicatorService.delete(indicatorId);
        toast.success('Indicator deleted successfully.');
        onDeleteSuccess();
        fetchIndicators();
      } catch (error) {
        console.error('Failed to delete indicator', error);
        toast.error('Failed to delete indicator.');
      }
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  if (loading) return <div className={styles.container}>Loading indicators...</div>;
  return (
    <div className={styles.container} data-cy="indicator-table">
      <div className={styles.tableHeader}>
        <h3 className={styles.title}>Latest Indicators</h3>
        <div className={styles.filters}>
          <select name="type" value={filters.type} onChange={handleFilterChange} data-cy="filter-type">
            <option value="">All Types</option>
            <option value="ip">IP</option>
            <option value="domain">Domain</option>
            <option value="url">URL</option>
            <option value="file_hash">File Hash</option>
            <option value="email">Email</option>
          </select>
          <select name="threat_level" value={filters.threat_level} onChange={handleFilterChange} data-cy="filter-threat-level">
            <option value="">All Threat Levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>
      
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>IOC Value</th>
              <th>Type</th>
              <th>Threat Level</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(indicators) && indicators.map(indicator => (
              <tr 
                key={indicator.id} 
                className={`${styles.row} ${onRowClick ? styles.clickableRow : ''}`} 
                data-cy={`indicator-row-${indicator.id}`}
                onClick={() => onRowClick?.(indicator)}
              >
                <td className={styles.value}>{indicator.value}</td>
                <td className={styles.type}>{indicator.type}</td>
                <td>
                  <span className={`${styles.threatBadge} ${styles[indicator.threat_level]}`}>
                    {indicator.threat_level}
                  </span>
                </td>
                <td>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(indicator);
                    }}
                    className={styles.actionButton}
                    data-cy={`edit-button-${indicator.id}`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(indicator.id);
                    }}
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    data-cy={`delete-button-${indicator.id}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
});