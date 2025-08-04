// client/src/App.tsx
import React, { useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { MetricCard } from './components/Dashboard/MetricCard';
import { IndicatorTable, IndicatorTableHandles } from './components/Dashboard/IndicatorTable';
import { Modal } from './components/shared/Modal';
import { AddIndicatorForm } from './components/Indicators/AddIndicatorForm';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const tableRef = useRef<IndicatorTableHandles>(null);

  const handleSuccess = () => {
    setIsModalOpen(false); // Chiudi il modale
    tableRef.current?.refetch(); // Ricarica i dati della tabella
  };

  return (
    <>
      <div className={layoutStyles.appContainer}>
        <Sidebar />
        <main className={layoutStyles.mainContent}>
          <Header onAddNew={() => setIsModalOpen(true)} />
          <div className={layoutStyles.pageContent}>
            <div className={dashboardStyles.dashboardGrid}>
              <div className={dashboardStyles.statsGrid}>
                <MetricCard title="New IOCs (24h)" value={loading ? '...' : stats?.newIocs24h} />
                <MetricCard title="Critical Alerts" value={loading ? '...' : stats?.criticalAlerts} />
                <MetricCard title="Active Investigations" value={loading ? '...' : stats?.activeInvestigations} />
                <MetricCard title="Data Feeds" value={loading ? '...' : stats?.dataFeeds} />
              </div>
              <IndicatorTable ref={tableRef} />
            </div>
          </div>
        </main>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Indicator">
        <AddIndicatorForm onSuccess={handleSuccess} />
      </Modal>
    </>
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