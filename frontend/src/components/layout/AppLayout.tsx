import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Brain, BarChart3, Upload, MessageSquare, GitFork,
  ShieldAlert, GitCompare, FolderOpen, Settings,
  LogOut, Menu, X, ChevronRight, ChevronLeft, Plus,
  Code2, Briefcase, BookOpenCheck, Files, Search,
  Sun, Moon, Laptop
} from 'lucide-react';
import { CommandPalette } from '../CommandPalette';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: BarChart3 },
  { label: 'Document Library', path: '/documents', icon: Files },
  { label: 'Ingest Document', path: '/upload', icon: Upload },
  { label: 'Ask Document (RAG)', path: '/ask', icon: MessageSquare },
  { label: 'Collections', path: '/collections', icon: FolderOpen },
  { label: 'Compare & Diff', path: '/compare', icon: GitCompare },
  { label: 'Knowledge Map', path: '/knowledge-map', icon: GitFork },
  { label: 'Contradictions', path: '/contradictions', icon: ShieldAlert },
  { label: 'Team Workspaces', path: '/workspaces', icon: Briefcase },
  { label: 'Developer API', path: '/developer', icon: Code2 },
  { label: 'Case Study', path: '/case-study', icon: BookOpenCheck },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('intellidoc_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('intellidoc_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentNavItem = NAV_ITEMS.find(
    (item) => item.path === location.pathname || (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
  );
  const pageTitle = currentNavItem ? currentNavItem.label : 'Document Intelligence';

  const renderNavLinks = (isMobile = false) => (
    <nav className="space-y-1 flex-1 overflow-y-auto pr-1">
      {!sidebarCollapsed && !isMobile && (
        <div className="text-[10px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 px-3 mb-2">
          Workspace
        </div>
      )}
      {NAV_ITEMS.map((item) => {
        const isActive =
          location.pathname === item.path ||
          (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
        const Icon = item.icon;

        return (
          <Link
            key={item.label}
            to={item.path}
            onClick={() => isMobile && setMobileMenuOpen(false)}
            title={sidebarCollapsed ? item.label : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
              isActive
                ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-semibold shadow-2xs'
                : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800/80 hover:text-surface-900 dark:hover:text-surface-100'
            } ${sidebarCollapsed && !isMobile ? 'justify-center px-2' : ''}`}
          >
            <Icon
              className={`w-4 h-4 shrink-0 transition-colors ${
                isActive ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400 group-hover:text-surface-600 dark:group-hover:text-surface-200'
              }`}
            />
            {(!sidebarCollapsed || isMobile) && (
              <span className="truncate">{item.label}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex w-full text-surface-900 dark:text-surface-100 transition-colors">
      {/* 1. DESKTOP SIDEBAR */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } shrink-0 bg-white dark:bg-surface-900 border-r border-surface-200/80 dark:border-surface-800 p-4 flex flex-col sticky top-0 h-screen hidden lg:flex z-20 transition-all duration-300`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-surface-100 dark:border-surface-800">
          <Link to="/dashboard" className="flex items-center gap-2.5 group overflow-hidden">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <span className="text-sm font-bold tracking-tight block truncate">
                  IntelliDoc <span className="gradient-text">AI</span>
                </span>
                <span className="text-[9px] uppercase font-semibold tracking-wider text-surface-400 dark:text-surface-500 block truncate">
                  Intelligence Workspace
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={toggleSidebar}
            className="p-1 rounded-lg text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick Ingest Button */}
        <div className="mb-4">
          <Link
            to="/upload"
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl gradient-bg text-white text-xs font-semibold shadow-xs hover:opacity-95 transition-opacity ${
              sidebarCollapsed ? 'px-2' : ''
            }`}
            title="Ingest Document"
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Ingest Document</span>}
          </Link>
        </div>

        {/* Navigation Items */}
        {renderNavLinks(false)}

        {/* System Health Indicator */}
        {!sidebarCollapsed && (
          <div className="mt-auto pt-3 pb-3 border-t border-surface-100 dark:border-surface-800">
            <div className="px-3 py-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-2 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate">AI & RAG Engine Online</span>
            </div>
          </div>
        )}

        {/* User Footer */}
        <div className={`pt-3 border-t border-surface-100 dark:border-surface-800 ${sidebarCollapsed ? 'mt-auto' : ''}`}>
          <div className="flex items-center gap-2.5 mb-2 px-1">
            <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold shadow-2xs shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-surface-900 dark:text-surface-100 truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-surface-400 truncate">{user?.email || 'user@intellidoc.ai'}</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={logout}
            className={`flex items-center gap-2 text-xs text-surface-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg px-2.5 py-1.5 w-full transition-colors font-medium ${
              sidebarCollapsed ? 'justify-center px-1' : ''
            }`}
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            {!sidebarCollapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* 2. MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-surface-900/50 backdrop-blur-xs transition-opacity"
          />
          <div className="relative w-72 max-w-[80vw] bg-white dark:bg-surface-900 h-full p-5 flex flex-col z-10 shadow-2xl animate-slide-right">
            <div className="flex items-center justify-between gap-2 mb-6 pb-3 border-b border-surface-100 dark:border-surface-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white">
                  <Brain className="w-4 h-4" />
                </div>
                <span className="text-base font-bold text-surface-900 dark:text-surface-100">
                  IntelliDoc <span className="gradient-text">AI</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <Link
                to="/upload"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl gradient-bg text-white text-xs font-semibold shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Ingest Document
              </Link>
            </div>

            {renderNavLinks(true)}

            <div className="pt-3 border-t border-surface-100 dark:border-surface-800 mt-auto">
              <button
                type="button"
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="flex items-center gap-2 text-xs text-surface-500 hover:text-rose-600 rounded-lg px-2 py-2 w-full font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Persistent Topbar */}
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md border-b border-surface-200/80 dark:border-surface-800 h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-sm sm:text-base font-bold text-surface-900 dark:text-surface-100 tracking-tight">
                {pageTitle}
              </h2>
            </div>
          </div>

          {/* Center Search trigger */}
          <div className="flex items-center gap-3 flex-1 max-w-md justify-end">
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center justify-between w-full max-w-xs px-3.5 py-1.5 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/60 text-surface-400 hover:border-surface-300 dark:hover:border-surface-700 transition-colors text-xs"
            >
              <span className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5" />
                <span>Search or jump to...</span>
              </span>
              <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 text-surface-500 font-sans">
                Ctrl K
              </kbd>
            </button>

            {/* Mobile search icon */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="sm:hidden p-2 rounded-xl text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800"
              title="Search commands"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Theme Toggle Button */}
            <div className="flex items-center border border-surface-200 dark:border-surface-800 rounded-xl p-0.5 bg-surface-50 dark:bg-surface-800">
              <button
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-lg transition-colors ${
                  theme === 'light' ? 'bg-white dark:bg-surface-700 text-amber-500 shadow-2xs' : 'text-surface-400 hover:text-surface-600'
                }`}
                title="Light Mode"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-lg transition-colors ${
                  theme === 'dark' ? 'bg-white dark:bg-surface-700 text-indigo-400 shadow-2xs' : 'text-surface-400 hover:text-surface-600'
                }`}
                title="Dark Mode"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`p-1.5 rounded-lg transition-colors ${
                  theme === 'system' ? 'bg-white dark:bg-surface-700 text-primary-600 shadow-2xs' : 'text-surface-400 hover:text-surface-600'
                }`}
                title="System Mode"
              >
                <Laptop className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
};

export default AppLayout;
