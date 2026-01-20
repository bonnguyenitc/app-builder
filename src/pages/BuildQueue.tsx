import React from 'react';
import { useBuildStore } from '../stores/buildStore';
import { useProjectStore } from '../stores/projectStore';
import { Terminal, Box, Clock, Download, AlertCircle, X } from 'lucide-react';
import { useDebouncedLogs } from '../hooks/useDebouncedLogs';
import { processLogsForDisplay, downloadLogs } from '../utils/logUtils';

export const BuildQueue: React.FC = () => {
  const { activeBuilds } = useBuildStore();
  const { projects } = useProjectStore();

  const activeBuildList = Object.values(activeBuilds);

  return (
    <div>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Build Queue</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Monitor active build processes
        </p>
      </div>

      {activeBuildList.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px',
            backgroundColor: 'var(--color-sidebar)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}
        >
          <Clock
            size={32}
            style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}
          />
          <p style={{ color: 'var(--color-text-secondary)' }}>No active builds at the moment.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          {activeBuildList.map((build) => {
            const project = projects.find((p) => p.id === build.projectId);
            return <BuildCard key={build.id} build={build} project={project} />;
          })}
        </div>
      )}
    </div>
  );
};

interface BuildCardProps {
  build: any;
  project: any;
}

const BuildCard: React.FC<BuildCardProps> = ({ build, project }) => {
  const { cancelBuild } = useBuildStore();
  const [showConfirm, setShowConfirm] = React.useState(false);

  // Debounce logs to prevent excessive re-renders
  const debouncedLogs = useDebouncedLogs(build.logs, 500);

  // Process logs for display
  const { displayLogs, hiddenCount, totalLines } = React.useMemo(
    () => processLogsForDisplay(debouncedLogs, 100),
    [debouncedLogs],
  );

  const handleDownloadLogs = () => {
    const filename = `${project?.name || 'build'}-${build.platform}-${Date.now()}.log`;
    downloadLogs(build.logs, filename);
  };

  const handleStopBuild = () => {
    setShowConfirm(true);
  };

  const confirmStop = () => {
    cancelBuild(build.projectId);
    setShowConfirm(false);
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Confirmation Dialog */}
      {showConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="card"
            style={{ maxWidth: '400px', padding: 'var(--spacing-lg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
              Stop Build?
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
              Are you sure you want to stop this build? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={confirmStop}
                style={{ backgroundColor: '#ff3b30' }}
              >
                Stop Build
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          padding: 'var(--spacing-md)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <Box size={20} style={{ color: 'var(--color-primary)' }} />
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>
              {project?.name || 'Unknown Project'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              {build.platform.toUpperCase()} • v{build.version} ({build.buildNumber})
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <button
            className="btn btn-secondary"
            onClick={handleStopBuild}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#ff3b30',
              borderColor: '#ff3b30',
            }}
            title="Stop build"
          >
            <X size={14} />
            <span>Stop</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleDownloadLogs}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Download full logs"
          >
            <Download size={14} />
            <span>Logs</span>
          </button>
          <div
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(0, 122, 255, 0.1)',
              color: 'var(--color-primary)',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            Building
          </div>
        </div>
      </div>

      <div
        style={{
          height: '4px',
          backgroundColor: 'var(--color-sidebar)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            height: '100%',
            backgroundColor: 'var(--color-primary)',
            width: '60%', // Mock progress
            transition: 'width 0.3s',
          }}
        />
      </div>

      <div
        style={{
          padding: 'var(--spacing-md)',
          backgroundColor: '#1e1e1e',
          color: '#d4d4d4',
          fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
          fontSize: '12px',
          maxHeight: '300px',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--spacing-sm)',
            color: '#86868b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <Terminal size={12} />
            <span>Build {build.platform === 'ios' ? 'Status' : 'Logs'}</span>
            {build.platform === 'android' && (
              <span style={{ fontSize: '11px' }}>
                ({totalLines} lines{hiddenCount > 0 ? `, showing last 100` : ''})
              </span>
            )}
          </div>
          {build.platform === 'android' && hiddenCount > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                color: '#ffa500',
              }}
            >
              <AlertCircle size={12} />
              <span>{hiddenCount} lines hidden (filtered)</span>
            </div>
          )}
        </div>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {build.platform === 'ios'
            ? displayLogs || 'Building iOS... Logs will be saved to file.'
            : displayLogs || 'Waiting for logs...'}
        </pre>
      </div>
    </div>
  );
};
