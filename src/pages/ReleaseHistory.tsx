import React, { useEffect } from 'react';
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
} from '../components/Icons';
import { BuildHistory } from '../types/project';

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

  return (
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
      onClick={onClose}
    >
      <div
        style={{
          width: '80%',
          height: '80%',
          backgroundColor: 'var(--color-bg-primary)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--spacing-md)',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Build Logs</h3>
            {build.logFilePath && (
              <button
                className="btn btn-ghost"
                onClick={handleOpenExternal}
                title="Open in External Editor"
                style={{ fontSize: '12px', height: '24px', padding: '0 8px' }}
              >
                Open External
              </button>
            )}
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '4px' }}>
            <CloseIcon size={20} />
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
          <pre
            style={{
              margin: 0,
              padding: '16px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '13px',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {build.logs || 'No logs available.'}
          </pre>
        </div>
      </div>
    </div>
  );
};

export const ReleaseHistory: React.FC = () => {
  const { buildHistory, currentPage, pageSize, totalItems, fetchHistory } = useBuildStore();
  const { projects } = useProjectStore();
  const [viewingBuild, setViewingBuild] = React.useState<BuildHistory | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

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
          Build History
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Review past builds and releases
        </p>
      </div>

      {buildHistory.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <HistoryIcon size={32} />
          </div>
          <h3 className="empty-state-title">No Build History</h3>
          <p className="empty-state-description">
            Your build history will appear here after you complete your first build.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Project</th>
                <th>Platform</th>
                <th>Version</th>
                <th>Release Note</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buildHistory.map((build, index) => {
                const project = projects.find((p) => p.id === build.projectId);
                return (
                  <tr
                    key={build.id}
                    style={{
                      animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`,
                    }}
                  >
                    <td>
                      {build.status === 'success' ? (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-xs)',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(52, 199, 89, 0.1)',
                            color: 'var(--color-success)',
                            fontWeight: 600,
                            fontSize: '12px',
                          }}
                        >
                          <CheckCircleIcon size={14} />
                          <span>Success</span>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-xs)',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(255, 59, 48, 0.1)',
                            color: 'var(--color-error)',
                            fontWeight: 600,
                            fontSize: '12px',
                          }}
                        >
                          <XCircleIcon size={14} />
                          <span>Failed</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{project?.name || 'Unknown'}</span>
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-xs)',
                        }}
                      >
                        <div
                          className={`icon-container ${build.platform === 'ios' ? 'icon-container-primary' : 'icon-container-success'}`}
                          style={{ padding: '4px' }}
                        >
                          {build.platform === 'ios' ? (
                            <AppleIcon size={12} />
                          ) : (
                            <AndroidIcon size={12} />
                          )}
                        </div>
                        <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>
                          {build.platform}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary" style={{ fontSize: '11px' }}>
                        v{build.version} ({build.buildNumber})
                      </span>
                    </td>
                    <td style={{ maxWidth: '200px' }}>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-text-secondary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={build.releaseNote}
                      >
                        {build.releaseNote || '—'}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '13px',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        {new Date(build.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        {build.status === 'success' && (
                          <button
                            className="btn btn-ghost"
                            title="Open Build Folder"
                            onClick={() => {
                              if (project) {
                                import('@tauri-apps/api/core').then(({ invoke }) => {
                                  invoke('open_build_folder', {
                                    project,
                                    platform: build.platform,
                                  }).catch((err) => console.error(err));
                                });
                              }
                            }}
                            style={{ padding: '6px' }}
                          >
                            <FolderIcon size={16} />
                          </button>
                        )}
                        <button
                          className="btn btn-ghost"
                          title="View Logs"
                          onClick={() => setViewingBuild(build)}
                          style={{ padding: '6px' }}
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

          {/* Pagination Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderTop: '1px solid var(--color-border)',
              background: 'var(--color-bg-secondary)',
            }}
          >
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Showing {Math.min(buildHistory.length, pageSize)} of {totalItems} results
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                className="btn btn-ghost"
                disabled={currentPage === 1}
                onClick={() => fetchHistory(currentPage - 1, pageSize)}
                style={{ padding: '6px' }}
                title="Previous Page"
              >
                <ChevronLeftIcon size={16} />
              </button>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>
                Page {currentPage} of {Math.max(1, Math.ceil(totalItems / pageSize))}
              </span>
              <button
                className="btn btn-ghost"
                disabled={currentPage >= Math.ceil(totalItems / pageSize)}
                onClick={() => fetchHistory(currentPage + 1, pageSize)}
                style={{ padding: '6px' }}
                title="Next Page"
              >
                <ChevronRightIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      {viewingBuild && <LogModal build={viewingBuild} onClose={() => setViewingBuild(null)} />}
    </div>
  );
};
