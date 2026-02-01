import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import {
  LayoutGridIcon,
  ClipboardListIcon,
  HistoryIcon,
  SettingsIcon,
  ImageIcon,
  StethoscopeIcon,
  SmartphoneIcon,
  ImagesIcon,
  KeyIcon,
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
import { EmulatorManager } from './pages/EmulatorManager';
import { StoreAssetsCreator } from './pages/StoreAssetsCreator';
import { KeystoreGenerator } from './pages/KeystoreGenerator';
import { DependencyManager } from './pages/DependencyManager';

interface NavItemInfo {
  to: string;
  icon: React.FC<{ size?: number }>;
  label: string;
}

const SidebarNavItem: React.FC<NavItemInfo> = ({ to, icon: Icon, label }) => (
  <NavLink to={to} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
    <Icon size={18} />
    <span>{label}</span>
  </NavLink>
);

const GENERAL_NAV_ITEMS: NavItemInfo[] = [
  { to: '/', icon: LayoutGridIcon, label: 'Projects' },
  { to: '/queue', icon: ClipboardListIcon, label: 'Build Queue' },
  { to: '/history', icon: HistoryIcon, label: 'History' },
  { to: '/icon-generator', icon: ImageIcon, label: 'Icon Generator' },
  { to: '/store-assets', icon: ImagesIcon, label: 'Store Assets' },
  { to: '/keystore', icon: KeyIcon, label: 'Keystore Generator' },
  { to: '/emulators', icon: SmartphoneIcon, label: 'Emulators' },
  { to: '/doctor', icon: StethoscopeIcon, label: 'Environment Doctor' },
];

const APP_NAV_ITEMS: NavItemInfo[] = [{ to: '/settings', icon: SettingsIcon, label: 'Settings' }];

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
            {GENERAL_NAV_ITEMS.map((item) => (
              <SidebarNavItem key={item.to} {...item} />
            ))}

            <div className="sidebar-header" style={{ marginTop: 'var(--spacing-xl)' }}>
              App
            </div>
            {APP_NAV_ITEMS.map((item) => (
              <SidebarNavItem key={item.to} {...item} />
            ))}
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
            <Route path="/store-assets" element={<StoreAssetsCreator />} />
            <Route path="/keystore" element={<KeystoreGenerator />} />
            <Route path="/emulators" element={<EmulatorManager />} />
            <Route path="/doctor" element={<Doctor />} />
            <Route path="/permissions/:projectId" element={<PermissionsManager />} />
            <Route path="/dependencies/:projectId" element={<DependencyManager />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
