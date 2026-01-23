import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import {
  LayoutGridIcon,
  ClipboardListIcon,
  HistoryIcon,
  SettingsIcon,
  ImageIcon,
  StethoscopeIcon,
} from './components/Icons';
import appIcon from './assets/app-icon.png';

import { useProjectStore } from './stores/projectStore';
import { useBuildStore } from './stores/buildStore';
import { Dashboard } from './pages/Dashboard';
import { BuildQueue } from './pages/BuildQueue';
import { ReleaseHistory } from './pages/ReleaseHistory';
import { Settings } from './pages/Settings';
import { IconGenerator } from './pages/IconGenerator';
import { PermissionsManager } from './pages/PermissionsManager';
import { Doctor } from './pages/Doctor';

function App() {
  const fetchProjects = useProjectStore((state) => state.fetchProjects);
  const fetchHistory = useBuildStore((state) => state.fetchHistory);

  useEffect(() => {
    fetchProjects();
    fetchHistory();
  }, [fetchProjects, fetchHistory]);

  return (
    <BrowserRouter>
      <div className="app-container">
        <aside className="sidebar">
          {/* Logo and Brand */}
          <div
            style={{
              marginBottom: 'var(--spacing-2xl)',
              paddingLeft: 'var(--spacing-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <img
              src={appIcon}
              alt="App Builder"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
              }}
            />
            <div>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                }}
              >
                App Builder
              </h2>
              <p
                style={{
                  fontSize: '11px',
                  color: 'var(--color-text-secondary)',
                  letterSpacing: '0.02em',
                }}
              >
                Build • Deploy • Ship
              </p>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="sidebar-header">General</div>
            <NavLink
              to="/"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <LayoutGridIcon size={18} />
              <span>Projects</span>
            </NavLink>
            <NavLink
              to="/queue"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <ClipboardListIcon size={18} />
              <span>Build Queue</span>
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <HistoryIcon size={18} />
              <span>History</span>
            </NavLink>
            <NavLink
              to="/icon-generator"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <ImageIcon size={18} />
              <span>Icon Generator</span>
            </NavLink>
            <NavLink
              to="/doctor"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <StethoscopeIcon size={18} />
              <span>Environment Doctor</span>
            </NavLink>

            <div className="sidebar-header" style={{ marginTop: 'var(--spacing-xl)' }}>
              App
            </div>
            <NavLink
              to="/settings"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <SettingsIcon size={18} />
              <span>Settings</span>
            </NavLink>
          </nav>

          {/* Footer branding */}
          <div
            style={{
              marginTop: 'auto',
              padding: 'var(--spacing-md)',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                padding: 'var(--spacing-sm)',
                borderRadius: 'var(--radius-md)',
                background:
                  'linear-gradient(135deg, rgba(0, 122, 255, 0.05) 0%, rgba(88, 86, 214, 0.05) 100%)',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--color-success)',
                  boxShadow: '0 0 8px rgba(52, 199, 89, 0.5)',
                }}
              />
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Ready to build
              </span>
            </div>
          </div>
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/queue" element={<BuildQueue />} />
            <Route path="/history" element={<ReleaseHistory />} />
            <Route path="/icon-generator" element={<IconGenerator />} />
            <Route path="/doctor" element={<Doctor />} />
            <Route path="/permissions/:projectId" element={<PermissionsManager />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
