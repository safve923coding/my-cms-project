import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';
import OfficerListPage from './pages/OfficerListPage';
import { AuthProvider } from './hooks/useAuth';
import ErrorBoundary from './ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/officers" element={<OfficerListPage />} />
          </Routes>
          <footer style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Design By Safe
          </footer>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
