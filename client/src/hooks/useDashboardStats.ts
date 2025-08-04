import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

interface DashboardStats {
  newIocs24h: number;
  criticalAlerts: number;
  activeInvestigations: number;
  dataFeeds: number;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<DashboardStats>('/indicators/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
      toast.error('Could not load dashboard statistics.');
      // Fallback to mock data if API fails
      const mockStats: DashboardStats = {
        newIocs24h: 147,
        criticalAlerts: 23,
        activeInvestigations: 8,
        dataFeeds: 12
      };
      setStats(mockStats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
};