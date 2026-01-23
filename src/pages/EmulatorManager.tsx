import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useProjectStore } from '../stores/projectStore';
import { AndroidIcon, AppleIcon, PlayIcon, SmartphoneIcon } from '../components/Icons';

interface Emulator {
  id: string;
  name: string;
  platform: 'android' | 'ios';
  state: 'Booted' | 'Shutdown';
  version: string;
}

export const EmulatorManager = () => {
  const [emulators, setEmulators] = useState<Emulator[]>([]);
  const [loading, setLoading] = useState(false);
  const { projects } = useProjectStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [launchingId, setLaunchingId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await invoke<Emulator[]>('list_emulators');
      setEmulators(list);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(() => {
      invoke<Emulator[]>('list_emulators').then(setEmulators).catch(console.error);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLaunch = async (em: Emulator) => {
    setLaunchingId(em.id);
    try {
      await invoke('launch_emulator', { id: em.id, platform: em.platform });
      // Refresh with delay to allow boot process to start registering
      setTimeout(refresh, 2000);
      setTimeout(refresh, 5000);
    } catch (e) {
      alert('Failed to launch: ' + e);
    }
    // Keep loading state properly managed or clear it
    setTimeout(() => setLaunchingId(null), 2000); // Visual feedback helper
  };

  const handleRunApp = async (em: Emulator) => {
    if (!selectedProjectId) {
      alert('Please select a project first to run.');
      return;
    }
    const project = projects.find((p) => p.id === selectedProjectId);
    if (!project) return;

    try {
      await invoke('run_app_on_emulator', {
        projectPath: project.path,
        platform: em.platform,
        deviceId: em.id,
      });
    } catch (e) {
      alert('Failed to run app: ' + e);
    }
  };

  const androidEmulators = emulators.filter((e) => e.platform === 'android');
  const iosEmulators = emulators.filter((e) => e.platform === 'ios');

  return (
    <div>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            marginBottom: '4px',
            color: 'var(--color-primary)',
          }}
        >
          Emulator Manager
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Manage and run simulators & emulators
        </p>
      </div>

      <div
        className="card"
        style={{ marginBottom: 'var(--spacing-xl)', padding: 'var(--spacing-lg)' }}
      >
        <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
          Select Project to Run
        </label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '10px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
          }}
        >
          <option value="">-- Select Project --</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {!selectedProjectId && (
          <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-warning)' }}>
            * Select a project to enable "Run App" button
          </p>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: 'var(--spacing-xl)',
        }}
      >
        {/* Android */}
        <div>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: 'var(--spacing-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div className="icon-container icon-container-success" style={{ padding: '6px' }}>
              <AndroidIcon size={18} />
            </div>
            Android Emulators
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {loading && androidEmulators.length === 0 && <p>Loading...</p>}
            {!loading && androidEmulators.length === 0 && (
              <p style={{ color: 'var(--color-text-secondary)' }}>
                No Android emulators available.
              </p>
            )}
            {androidEmulators.map((e) => (
              <EmulatorCard
                key={e.id}
                emulator={e}
                onLaunch={handleLaunch}
                onRun={handleRunApp}
                isLaunching={launchingId === e.id}
                canRun={!!selectedProjectId}
              />
            ))}
          </div>
        </div>

        {/* iOS */}
        <div>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: 'var(--spacing-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div className="icon-container icon-container-primary" style={{ padding: '6px' }}>
              <AppleIcon size={18} />
            </div>
            iOS Simulators
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {loading && iosEmulators.length === 0 && <p>Loading...</p>}
            {!loading && iosEmulators.length === 0 && (
              <p style={{ color: 'var(--color-text-secondary)' }}>No iOS simulators available.</p>
            )}
            {iosEmulators.map((e) => (
              <EmulatorCard
                key={e.id}
                emulator={e}
                onLaunch={handleLaunch}
                onRun={handleRunApp}
                isLaunching={launchingId === e.id}
                canRun={!!selectedProjectId}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmulatorCard = ({
  emulator,
  onLaunch,
  onRun,
  isLaunching,
  canRun,
}: {
  emulator: Emulator;
  onLaunch: (e: Emulator) => void;
  onRun: (e: Emulator) => void;
  isLaunching: boolean;
  canRun: boolean;
}) => {
  const isBooted = emulator.state === 'Booted';

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--spacing-md)',
      }}
    >
      <div style={{ overflow: 'hidden', marginRight: '8px' }}>
        <div
          style={{
            fontWeight: 600,
            marginBottom: '4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={emulator.name}
        >
          {emulator.name}{' '}
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 400 }}>
            ({emulator.version})
          </span>
        </div>
        <div
          style={{
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--color-text-secondary)',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isBooted ? 'var(--color-success)' : 'var(--color-text-tertiary)',
            }}
          />
          {isLaunching ? 'Booting...' : emulator.state}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        {!isBooted && (
          <button
            className="btn btn-secondary"
            onClick={() => onLaunch(emulator)}
            disabled={isLaunching}
            style={{ fontSize: '13px', padding: '6px 12px', gap: '6px' }}
          >
            <PlayIcon size={14} />
            {isLaunching ? '...' : 'Boot'}
          </button>
        )}
        {isBooted && (
          <button
            className="btn btn-primary"
            onClick={() => onRun(emulator)}
            disabled={!canRun}
            title={!canRun ? 'Select a project first' : 'Run App'}
            style={{ fontSize: '13px', padding: '6px 12px', gap: '6px', opacity: canRun ? 1 : 0.5 }}
          >
            <SmartphoneIcon size={14} /> Run
          </button>
        )}
      </div>
    </div>
  );
};
