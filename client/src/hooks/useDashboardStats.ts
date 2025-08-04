import { useState, useEffect } from 'react';

interface DashboardStats {
  newIocs24h: number;
  criticalAlerts: number;
  activeInvestigations: number;
  dataFeeds: number;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with mock data
    const fetchStats = async () => {
      setLoading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockStats: DashboardStats = {
        newIocs24h: 147,
        criticalAlerts: 23,
        activeInvestigations: 8,
        dataFeeds: 12
      };
      
      setStats(mockStats);
      setLoading(false);
    };

    fetchStats();
  }, []);

  return { stats, loading };
};