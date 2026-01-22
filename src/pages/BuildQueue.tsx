import React from 'react';
import { useBuildStore } from '../stores/buildStore';
import { useProjectStore } from '../stores/projectStore';
import { Terminal, Clock, Download, AlertCircle, X, Loader, Apple, Smartphone } from 'lucide-react';
import { useDebouncedLogs } from '../hooks/useDebouncedLogs';
import { processLogsForDisplay, downloadLogs } from '../utils/logUtils';

export const BuildQueue: React.FC = () => {
  const { activeBuilds } = useBuildStore();
  const { projects } = useProjectStore();

  const activeBuildList = Object.values(activeBuilds);

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            marginBottom: '4px',
            color: 'var(--color-primary)',
          }}
        >
          Build Queue
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Monitor active build processes in real-time
        </p>
      </div>

      {activeBuildList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Clock size={32} />
          </div>
          <h3 className="empty-state-title">No Active Builds</h3>
          <p className="empty-state-description">
            All quiet here! Start a build from your Projects page to see it in action.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          {activeBuildList.map((build, index) => {
            const project = projects.find((p) => p.id === build.projectId);
            return (
              <div
                key={build.id}
                style={{
                  animation: `fadeInUp 0.4s ease-out ${index * 0.1}s both`,
                }}
              >
                <BuildCard build={build} project={project} />
              </div>
            );
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
    <div
      className="card"
      style={{
        padding: 0,
        overflow: 'hidden',
        border: '1px solid rgba(0, 122, 255, 0.2)',
      }}
    >
      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div
            className="card modal-content"
            style={{ maxWidth: '400px', padding: 'var(--spacing-xl)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(255, 59, 48, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--spacing-lg)',
              }}
            >
              <X size={28} style={{ color: 'var(--color-error)' }} />
            </div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: 'var(--spacing-sm)',
                textAlign: 'center',
              }}
            >
              Stop Build?
            </h3>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--spacing-xl)',
                textAlign: 'center',
              }}
            >
              Are you sure you want to stop this build? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowConfirm(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmStop} style={{ flex: 1 }}>
                Stop Build
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          padding: 'var(--spacing-lg)',
          background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-sidebar) 100%)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background:
                build.platform === 'ios' ? 'var(--gradient-primary)' : 'var(--gradient-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow:
                build.platform === 'ios'
                  ? '0 4px 12px rgba(0, 122, 255, 0.3)'
                  : '0 4px 12px rgba(52, 199, 89, 0.3)',
            }}
          >
            {build.platform === 'ios' ? (
              <Apple size={22} color="white" />
            ) : (
              <Smartphone size={22} color="white" />
            )}
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '2px' }}>
              {project?.name || 'Unknown Project'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <span
                className={`badge ${build.platform === 'ios' ? 'badge-primary' : 'badge-success'}`}
              >
                {build.platform.toUpperCase()}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                v{build.version} ({build.buildNumber})
              </span>
            </div>
            {build.releaseNote && (
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                  marginTop: '4px',
                  fontStyle: 'italic',
                }}
              >
                📝 {build.releaseNote}
              </p>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <button
            className="btn btn-secondary"
            onClick={handleStopBuild}
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              color: 'var(--color-error)',
              borderColor: 'var(--color-error)',
            }}
          >
            <X size={14} />
            <span>Stop</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleDownloadLogs}
            style={{
              padding: '8px 14px',
              fontSize: '13px',
            }}
          >
            <Download size={14} />
            <span>Logs</span>
          </button>
          <div
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--gradient-primary)',
              color: 'white',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)',
            }}
          >
            <Loader size={12} className="animate-spin" />
            Building
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar" style={{ borderRadius: 0 }}>
        <div
          className="progress-bar-fill"
          style={{
            width: '60%',
            borderRadius: 0,
            background:
              build.platform === 'ios' ? 'var(--gradient-primary)' : 'var(--gradient-success)',
          }}
        />
      </div>

      {/* Terminal Logs */}
      <div
        style={{
          padding: 'var(--spacing-md)',
          backgroundColor: '#0d1117',
          color: '#c9d1d9',
          fontFamily: "'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace",
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
            marginBottom: 'var(--spacing-md)',
            paddingBottom: 'var(--spacing-sm)',
            borderBottom: '1px solid #21262d',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <Terminal size={14} style={{ color: '#58a6ff' }} />
            <span style={{ color: '#8b949e' }}>
              Build {build.platform === 'ios' ? 'Status' : 'Logs'}
            </span>
            {build.platform === 'android' && (
              <span style={{ fontSize: '11px', color: '#6e7681' }}>
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
                color: '#d29922',
              }}
            >
              <AlertCircle size={12} />
              <span>{hiddenCount} lines hidden</span>
            </div>
          )}
        </div>
        <pre
          style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: 1.6,
          }}
        >
          {build.platform === 'ios'
            ? displayLogs || '⏳ Building iOS... Logs will be saved to file.'
            : displayLogs || '⏳ Waiting for logs...'}
        </pre>
      </div>
    </div>
  );
};
