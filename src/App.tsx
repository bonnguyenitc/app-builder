import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutGrid, ClipboardList, History, Settings as SettingsIcon } from 'lucide-react';

import { useProjectStore } from './stores/projectStore';
import { useBuildStore } from './stores/buildStore';
import { Dashboard } from './pages/Dashboard';
import { BuildQueue } from './pages/BuildQueue';
import { ReleaseHistory } from './pages/ReleaseHistory';
import { Settings } from './pages/Settings';

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
          <div
            style={{
              marginBottom: 'var(--spacing-xl)',
              paddingLeft: 'var(--spacing-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <img
              src="/app-icon.png"
              alt="App Icon"
              style={{ width: '32px', height: '32px', borderRadius: '8px' }}
            />
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>App Builder</h2>
          </div>

          <nav className="sidebar-nav">
            <div className="sidebar-header">General</div>
            <NavLink
              to="/"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <LayoutGrid size={18} />
              <span>Projects</span>
            </NavLink>
            <NavLink
              to="/queue"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <ClipboardList size={18} />
              <span>Build Queue</span>
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <History size={18} />
              <span>History</span>
            </NavLink>

            <div className="sidebar-header" style={{ marginTop: 'var(--spacing-lg)' }}>
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
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/queue" element={<BuildQueue />} />
            <Route path="/history" element={<ReleaseHistory />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
