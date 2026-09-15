import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ToastContainer';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DocumentsPage from './pages/DocumentsPage';
import UploadPage from './pages/UploadPage';
import DocumentPage from './pages/DocumentPage';
import AskDocumentPage from './pages/AskDocumentPage';
import KnowledgeMapPage from './pages/KnowledgeMapPage';
import ContradictionsPage from './pages/ContradictionsPage';
import ComparePage from './pages/ComparePage';
import CollectionsPage from './pages/CollectionsPage';
import SettingsPage from './pages/SettingsPage';
import DeveloperPage from './pages/DeveloperPage';
import WorkspacesPage from './pages/WorkspacesPage';
import CaseStudyPage from './pages/CaseStudyPage';
import { AppLayout } from './components/layout/AppLayout';
import './index.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-50">
        <div className="animate-pulse-soft text-primary-600 text-lg font-semibold">Loading IntelliDoc AI...</div>
      </div>
    );
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Authenticated Workspace with Persistent AppLayout */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/document/:id" element={<DocumentPage />} />
          <Route path="/ask" element={<AskDocumentPage />} />
          <Route path="/workspaces" element={<WorkspacesPage />} />
          <Route path="/developer" element={<DeveloperPage />} />
          <Route path="/case-study" element={<CaseStudyPage />} />
          <Route path="/knowledge-map" element={<KnowledgeMapPage />} />
          <Route path="/contradictions" element={<ContradictionsPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
