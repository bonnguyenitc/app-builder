import React, { useEffect, useState } from 'react';
import { useBuildStore } from '../stores/buildStore';
import { useProjectStore } from '../stores/projectStore';
import {
  CheckCircleIcon,
  XCircleIcon,
  FolderIcon,
  FileTextIcon,
  HistoryIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  AppleIcon,
  AndroidIcon,
  TerminalIcon,
  ActivityIcon,
} from '../components/Icons';
import { BuildHistory } from '../types/project';
import { AppSizeAnalyzer } from '../components/AppSizeAnalyzer';

const LogModal = ({ build, onClose }: { build: BuildHistory; onClose: () => void }) => {
  const handleOpenExternal = () => {
    if (build.logFilePath) {
      import('@tauri-apps/api/core').then(({ invoke }) => {
        invoke('open_log_file', {
          logFilePath: build.logFilePath,
        }).catch((err) => console.error(err));
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      style={{ backdropFilter: 'blur(12px)', background: 'rgba(0,0,0,0.7)', zIndex: 2000 }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '90%',
          maxWidth: '1200px',
          height: '85%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.1)',
          overflow: 'hidden',
          borderRadius: '28px',
          background: '#0D0F12',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid #1A1D23',
            background: '#15181E',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <TerminalIcon size={20} style={{ color: 'var(--color-primary)' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#FFF' }}>
                Build Terminal Output
              </h3>
              <span style={{ fontSize: '12px', color: '#888' }}>
                v{build.version} ({build.buildNumber}) •{' '}
                {new Date(build.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {build.logFilePath && (
              <button
                className="btn btn-secondary"
                onClick={handleOpenExternal}
                style={{ height: '36px', borderRadius: '10px', fontSize: '13px' }}
              >
                Open External
              </button>
            )}
            <button
              className="btn btn-ghost"
              onClick={onClose}
              style={{ width: '36px', height: '36px', borderRadius: '50%', padding: 0 }}
            >
              <CloseIcon size={20} />
            </button>
          </div>
        </div>
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '24px',
            fontFamily: '"SF Mono", "Fira Code", monospace',
            fontSize: '13px',
            lineHeight: '1.7',
            color: '#E0E0E0',
            background: '#0D0F12',
          }}
        >
          {build.logs ? (
            build.logs.split('\n').map((line, i) => (
              <div
                key={i}
                style={{
                  borderBottom: '1px solid #15181E',
                  paddingBottom: '2px',
                  marginBottom: '2px',
                }}
              >
                <span
                  style={{
                    color: '#444',
                    marginRight: '16px',
                    userSelect: 'none',
                    display: 'inline-block',
                    width: '30px',
                    textAlign: 'right',
                  }}
                >
                  {i + 1}
                </span>
                {line}
              </div>
            ))
          ) : (
            <div
              style={{
                color: '#555',
                fontStyle: 'italic',
                textAlign: 'center',
                marginTop: '100px',
              }}
            >
              No logs captured for this build.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ReleaseHistory: React.FC = () => {
  const { buildHistory, currentPage, pageSize, totalItems, fetchHistory, selectedProjectId } =
    useBuildStore();
  const { projects } = useProjectStore();
  const { fetchProjects } = useProjectStore();
  const [viewingBuild, setViewingBuild] = useState<BuildHistory | null>(null);
  const [analyzingBuild, setAnalyzingBuild] = useState<BuildHistory | null>(null);

  useEffect(() => {
    fetchHistory();
    fetchProjects();
  }, [fetchHistory, fetchProjects]);

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
        <div style={{ flex: 1 }}>
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
            Build History
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', marginTop: '4px' }}>
            Trace back every release and monitor your deployment performance.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Project Filter */}
          <div
            style={{
              background: 'var(--color-sidebar)',
              padding: '6px 12px',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-tertiary)' }}
            >
              PROJECT:
            </span>
            <select
              title="Filter by Project"
              value={selectedProjectId || ''}
              onChange={(e) => fetchHistory(1, pageSize, e.target.value || null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text)',
                fontSize: '14px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              background: 'var(--color-sidebar)',
              padding: '12px 20px',
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
              textAlign: 'right',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: 'var(--color-text-tertiary)',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Total Records
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)' }}>
              {totalItems}
            </div>
          </div>
        </div>
      </header>

      {/* Content Area */}
      {buildHistory.length === 0 ? (
        <div
          className="empty-state"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'var(--color-sidebar)',
            borderRadius: '32px',
            border: '2px dashed var(--color-border)',
            margin: '0 0 32px',
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
            <HistoryIcon size={40} style={{ opacity: 0.3 }} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Clean Slate</h3>
          <p
            style={{ color: 'var(--color-text-secondary)', maxWidth: '300px', textAlign: 'center' }}
          >
            No builds found yet. Once you start deploying, your history will populate here.
          </p>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          <div
            className="card"
            style={{
              borderRadius: '24px',
              padding: '24px',
              border: '1px solid var(--color-border)',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                <thead
                  style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--color-card)' }}
                >
                  <tr
                    style={{
                      color: 'var(--color-text-tertiary)',
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    <th style={{ padding: '0 16px 12px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '0 16px 12px', textAlign: 'left' }}>App / Project</th>
                    <th style={{ padding: '0 16px 12px', textAlign: 'left' }}>Platform</th>
                    <th style={{ padding: '0 16px 12px', textAlign: 'left' }}>Version</th>
                    <th style={{ padding: '0 16px 12px', textAlign: 'left' }}>Release Notes</th>
                    <th style={{ padding: '0 16px 12px', textAlign: 'left' }}>Timestamp</th>
                    <th style={{ padding: '0 16px 12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {buildHistory.map((build, index) => {
                    const project = projects.find((p) => p.id === build.projectId);
                    return (
                      <tr
                        key={build.id}
                        className="table-row-hover"
                        style={{
                          transition: 'all 0.2s',
                          animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s both`,
                        }}
                      >
                        <td
                          style={{
                            padding: '16px',
                            background: 'var(--color-sidebar)',
                            borderTopLeftRadius: '12px',
                            borderBottomLeftRadius: '12px',
                          }}
                        >
                          {build.status === 'success' ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 12px',
                                borderRadius: '8px',
                                background: 'rgba(52, 199, 89, 0.1)',
                                color: 'var(--color-success)',
                                fontSize: '11px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                              }}
                            >
                              <CheckCircleIcon size={12} /> Success
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 12px',
                                borderRadius: '8px',
                                background: 'rgba(255, 59, 48, 0.1)',
                                color: 'var(--color-error)',
                                fontSize: '11px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                              }}
                            >
                              <XCircleIcon size={12} /> Failed
                            </span>
                          )}
                        </td>
                        <td
                          style={{
                            padding: '16px',
                            background: 'var(--color-sidebar)',
                            fontWeight: 700,
                          }}
                        >
                          {project?.name || 'Unknown Project'}
                        </td>
                        <td style={{ padding: '16px', background: 'var(--color-sidebar)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {build.platform === 'ios' ? (
                              <AppleIcon size={14} />
                            ) : (
                              <AndroidIcon size={14} />
                            )}
                            <span
                              style={{
                                fontSize: '14px',
                                fontWeight: 500,
                                textTransform: 'capitalize',
                              }}
                            >
                              {build.platform}
                              {build.format && (
                                <span
                                  style={{
                                    marginLeft: '8px',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: 'rgba(255,255,255,0.05)',
                                    fontSize: '10px',
                                    fontWeight: 800,
                                  }}
                                >
                                  {build.format.toUpperCase()}
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '16px', background: 'var(--color-sidebar)' }}>
                          <span
                            style={{
                              background: 'rgba(0, 122, 255, 0.1)',
                              color: 'var(--color-primary)',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          >
                            v{build.version} ({build.buildNumber})
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '16px',
                            background: 'var(--color-sidebar)',
                            maxWidth: '240px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '13px',
                              color: 'var(--color-text-secondary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={build.releaseNote}
                          >
                            {build.releaseNote || 'No notes provided'}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: '16px',
                            background: 'var(--color-sidebar)',
                            fontSize: '13px',
                            color: 'var(--color-text-tertiary)',
                          }}
                        >
                          {new Date(build.timestamp).toLocaleDateString()} at{' '}
                          {new Date(build.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td
                          style={{
                            padding: '16px',
                            background: 'var(--color-sidebar)',
                            borderTopRightRadius: '12px',
                            borderBottomRightRadius: '12px',
                            textAlign: 'right',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {build.artifactPath && (
                                <button
                                  className="btn btn-ghost"
                                  onClick={() => setAnalyzingBuild(build)}
                                  title="Analyze Artifact Size"
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    padding: 0,
                                    color: 'var(--color-primary)',
                                    background: 'rgba(0, 122, 255, 0.05)',
                                  }}
                                >
                                  <ActivityIcon size={16} />
                                </button>
                              )}
                              <button
                                className="btn btn-ghost"
                                onClick={() => {
                                  if (project) {
                                    import('@tauri-apps/api/core').then(({ invoke }) => {
                                      invoke('open_build_folder', {
                                        project,
                                        platform: build.platform,
                                        format: build.format,
                                      }).catch((err) => console.error(err));
                                    });
                                  }
                                }}
                                style={{ width: '32px', height: '32px', padding: 0 }}
                              >
                                <FolderIcon size={16} />
                              </button>
                            </div>
                            <button
                              className="btn btn-ghost"
                              onClick={() => setViewingBuild(build)}
                              style={{ width: '32px', height: '32px', padding: 0 }}
                            >
                              <FileTextIcon size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <footer
              style={{
                marginTop: '24px',
                padding: '16px 0 0',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
                Showing <strong>{Math.min(buildHistory.length, pageSize)}</strong> per page of{' '}
                <strong>{totalItems}</strong> entries
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    className="btn btn-secondary"
                    disabled={currentPage === 1}
                    onClick={() => fetchHistory(currentPage - 1, pageSize)}
                    style={{ width: '36px', height: '36px', borderRadius: '10px', padding: 0 }}
                  >
                    <ChevronLeftIcon size={18} />
                  </button>
                  <button
                    className="btn btn-secondary"
                    disabled={currentPage >= Math.ceil(totalItems / pageSize)}
                    onClick={() => fetchHistory(currentPage + 1, pageSize)}
                    style={{ width: '36px', height: '36px', borderRadius: '10px', padding: 0 }}
                  >
                    <ChevronRightIcon size={18} />
                  </button>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>
                  Page {currentPage}{' '}
                  <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}>
                    of {Math.max(1, Math.ceil(totalItems / pageSize))}
                  </span>
                </span>
              </div>
            </footer>
          </div>
        </div>
      )}

      {viewingBuild && <LogModal build={viewingBuild} onClose={() => setViewingBuild(null)} />}

      {analyzingBuild && analyzingBuild.artifactPath && (
        <AppSizeAnalyzer
          artifactPath={analyzingBuild.artifactPath}
          appName={projects.find((p) => p.id === analyzingBuild.projectId)?.name || 'Unknown'}
          onClose={() => setAnalyzingBuild(null)}
        />
      )}

      <style>{`
        .table-row-hover:hover td {
          background: var(--color-border) !important;
          transform: scale(1.002);
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
