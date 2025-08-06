// client/src/types/index.ts

export interface Tag {
  id: string;
  name: string;
}

export interface Indicator {
  id: string;
  value: string;
  type: 'ip' | 'domain' | 'url' | 'file_hash' | 'email';
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  is_active: boolean;
  first_seen: string;
  last_seen: string;
  created_by: {
    id: string;
    email: string;
  };

  // AbuseIPDB enrichment fields (optional)
  country_code?: string | null;
  isp?: string | null;
  abuse_score?: number | null;
  domain_usage?: string | null;
  latitude?: number | string | null; // Can be string due to PostgreSQL decimal handling
  longitude?: number | string | null; // Can be string due to PostgreSQL decimal handling
  
  // Tags (optional)
  tags?: Tag[];
}

export interface ApiResponse<T> {
  data: T;
  total?: number;
}

export interface DashboardStats {
  newIocs24h: number;
  criticalAlerts: number;
  totalActiveIndicators: number;
  activeInvestigations: number;
  dataFeeds: number;
}