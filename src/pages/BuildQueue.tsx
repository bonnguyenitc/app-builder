import React, { useMemo, useState, useEffect } from 'react';
import { useBuildStore } from '../stores/buildStore';
import { useProjectStore } from '../stores/projectStore';
import {
  TerminalIcon,
  ClockIcon,
  DownloadIcon,
  AlertCircleIcon,
  CloseIcon,
  LoaderIcon,
  AppleIcon,
  AndroidIcon,
} from '../components/Icons';
import { useDebouncedLogs } from '../hooks/useDebouncedLogs';
import { processLogsForDisplay, downloadLogs } from '../utils/logUtils';

export const BuildQueue: React.FC = () => {
  const { activeBuilds } = useBuildStore();
  const { projects } = useProjectStore();

  const activeBuildList = Object.values(activeBuilds);

  return (
    <div
      className="page-container"
      style={{
        padding: 'var(--spacing-2xl)',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        maxWidth: '1600px',
        margin: '0 auto',
      }}
    >
      {/* Premium Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          flexShrink: 0,
          animation: 'fadeInDown 0.5s ease-out',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                color: 'var(--color-primary)',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Studio tools
            </span>
          </div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: 'var(--color-text)',
              letterSpacing: '-0.02em',
            }}
          >
            Build Queue
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', marginTop: '4px' }}>
            Monitor active build processes and real-time terminal outputs.
          </p>
        </div>

        <div
          style={{
            background: 'var(--color-sidebar)',
            padding: '12px 24px',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--color-text-tertiary)',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Active Processes
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--color-primary)',
                textAlign: 'center',
              }}
            >
              {activeBuildList.length}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          paddingBottom: '40px',
          margin: '0 -8px',
          padding: '8px',
        }}
      >
        {activeBuildList.length === 0 ? (
          <div
            className="empty-state"
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              background: 'var(--color-sidebar)',
              borderRadius: '32px',
              border: '2px dashed var(--color-border)',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '24px',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
              }}
            >
              <ClockIcon size={40} style={{ opacity: 0.3 }} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              No Active Builds
            </h3>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                maxWidth: '320px',
                textAlign: 'center',
              }}
            >
              Your build engine is idle. Start a build from the projects page to see live activity
              here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {activeBuildList.map((build, index) => {
              const project = projects.find((p) => p.id === build.projectId);
              return (
                <div
                  key={build.id}
                  style={{
                    animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s both`,
                  }}
                >
                  <BuildCard build={build} project={project} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

interface BuildCardProps {
  build: any;
  project: any;
}

const BuildCard: React.FC<BuildCardProps> = ({ build, project }) => {
  const { cancelBuild } = useBuildStore();
  const [showConfirm, setShowConfirm] = useState(false);
  const logContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showConfirm) setShowConfirm(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showConfirm]);

  // Debounce logs to prevent excessive re-renders
  const debouncedLogs = useDebouncedLogs(build.logs, 500);

  // Process logs for display
  const { displayLogs, hiddenCount, totalLines } = useMemo(
    () => processLogsForDisplay(debouncedLogs, 150),
    [debouncedLogs],
  );

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [displayLogs]);

  const handleDownloadLogs = () => {
    const filename = `${project?.name || 'build'}-${build.platform}-${Date.now()}.log`;
    downloadLogs(build.logs, filename);
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
        background: 'var(--color-card)',
        borderRadius: '24px',
        border: '1px solid var(--color-border)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
      }}
    >
      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          className="modal-overlay"
          style={{ backdropFilter: 'blur(12px)', background: 'rgba(0,0,0,0.7)', zIndex: 100 }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="card modal-content"
            style={{
              maxWidth: '420px',
              padding: '32px',
              borderRadius: '28px',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'rgba(255, 59, 48, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <CloseIcon size={32} style={{ color: 'var(--color-error)' }} />
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>
              Abort Build?
            </h3>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                marginBottom: '32px',
                lineHeight: 1.6,
              }}
            >
              Stopping the process for{' '}
              <strong style={{ color: 'var(--color-text)' }}>{project?.name}</strong> may leave
              build artifacts. Are you sure?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowConfirm(false)}
                style={{ flex: 1, height: '48px', borderRadius: '14px' }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={confirmStop}
                style={{
                  flex: 1,
                  height: '48px',
                  borderRadius: '14px',
                  background: 'var(--color-error)',
                }}
              >
                Stop Build
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Header */}
      <div
        style={{
          padding: '24px',
          background: '#15181E',
          borderBottom: '1px solid #222',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '18px',
              background:
                build.platform === 'ios' ? 'var(--gradient-primary)' : 'var(--gradient-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
            }}
          >
            {build.platform === 'ios' ? (
              <AppleIcon size={28} style={{ color: 'white' }} />
            ) : (
              <AndroidIcon size={28} style={{ color: 'white' }} />
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
                {project?.name || 'Building...'}
              </h3>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                v{build.version}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: build.platform === 'ios' ? 'var(--color-primary)' : 'var(--color-success)',
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {build.platform} Deployment
              </span>
              <span
                style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#444' }}
              />
              <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
                Build #{build.buildNumber}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn btn-ghost"
            onClick={handleDownloadLogs}
            style={{ height: '40px', padding: '0 16px', borderRadius: '12px' }}
          >
            <DownloadIcon size={18} />
            <span style={{ fontWeight: 600 }}>Raw Logs</span>
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => setShowConfirm(true)}
            style={{
              height: '40px',
              padding: '0 16px',
              borderRadius: '12px',
              color: 'var(--color-error)',
            }}
          >
            <CloseIcon size={18} />
            <span style={{ fontWeight: 600 }}>Cancel</span>
          </button>
          <div
            style={{
              height: '40px',
              padding: '0 20px',
              borderRadius: '12px',
              background: 'var(--color-primary)',
              color: 'white',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 16px rgba(0, 122, 255, 0.2)',
            }}
          >
            <LoaderIcon size={14} className="animate-spin" />
            LIVE
          </div>
        </div>
      </div>

      {/* Progress Bar Animation */}
      <div
        style={{
          height: '2px',
          background: '#222',
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '40%',
            background: build.platform === 'ios' ? 'var(--color-primary)' : 'var(--color-success)',
            animation: 'progressAnim 2s infinite ease-in-out',
          }}
        />
      </div>

      {/* Terminal Section */}
      <div
        ref={logContainerRef}
        style={{
          padding: '24px',
          background: '#0D0F12',
          height: '400px',
          overflowY: 'auto',
          fontFamily: '"SF Mono", "Fira Code", monospace',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px',
            fontSize: '12px',
            color: 'var(--color-text-tertiary)',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          <TerminalIcon size={14} style={{ color: 'var(--color-primary)' }} />
          Standard Output
          <div style={{ flex: 1, height: '1px', background: '#222' }} />
          <span>{totalLines} lines captured</span>
        </div>

        <pre
          style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: '1.7',
            color: '#E0E0E0',
            fontSize: '13px',
          }}
        >
          {displayLogs ||
            (build.platform === 'ios'
              ? '⏳ Compiling Swift & Objective-C sources... Detailed logs are being piped to filesystem.'
              : '⏳ Orchestrating build nodes...')}
        </pre>

        {hiddenCount > 0 && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              background: 'rgba(210, 153, 34, 0.1)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#d29922',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <AlertCircleIcon size={16} />
            <span>
              Truncated {hiddenCount} lines for performance. Download raw logs for full trace.
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes progressAnim {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
};
