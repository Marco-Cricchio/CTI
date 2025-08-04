// client/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { MetricCard } from './components/Dashboard/MetricCard';
import { IndicatorTable } from './components/Dashboard/IndicatorTable';
import { useDashboardStats } from './hooks/useDashboardStats';
import layoutStyles from './components/Layout/Layout.module.css';
import dashboardStyles from './components/Dashboard/Dashboard.module.css';
import { Toaster } from 'react-hot-toast';

// Componente per la route protetta
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
};

// Componente per la pagina della Dashboard
function DashboardPage() {
  const { stats, loading } = useDashboardStats();
  return (
    <div className={layoutStyles.appContainer}>
      <Sidebar />
      <main className={layoutStyles.mainContent}>
        <Header />
        <div className={layoutStyles.pageContent}>
          <div className={dashboardStyles.dashboardGrid}>
            <div className={dashboardStyles.statsGrid}>
              <MetricCard title="New IOCs (24h)" value={loading ? '...' : stats?.newIocs24h} />
              <MetricCard title="Critical Alerts" value={loading ? '...' : stats?.criticalAlerts} />
              <MetricCard title="Active Investigations" value={loading ? '...' : stats?.activeInvestigations} />
              <MetricCard title="Data Feeds" value={loading ? '...' : stats?.dataFeeds} />
            </div>
            <IndicatorTable />
          </div>
        </div>
      </main>
    </div>
  );
}

// Componente App principale con il router
function App() {
  const { user } = useAuth();
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' },
          error: { iconTheme: { primary: 'var(--accent-red)', secondary: 'white' } },
        }}
      />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;