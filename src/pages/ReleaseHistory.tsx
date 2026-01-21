import React from 'react';
import { useBuildStore } from '../stores/buildStore';
import { useProjectStore } from '../stores/projectStore';
import { CheckCircle2, XCircle, Apple, Smartphone, FolderOpen, FileText } from 'lucide-react';

export const ReleaseHistory: React.FC = () => {
  const { buildHistory } = useBuildStore();
  const { projects } = useProjectStore();

  return (
    <div>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>History</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Review past builds and releases
        </p>
      </div>

      {buildHistory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', opacity: 0.5 }}>
          <p>No build history yet.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  textAlign: 'left',
                  backgroundColor: 'var(--color-sidebar)',
                }}
              >
                <th style={{ padding: '12px var(--spacing-md)' }}>Status</th>
                <th style={{ padding: '12px var(--spacing-md)' }}>Project</th>
                <th style={{ padding: '12px var(--spacing-md)' }}>Platform</th>
                <th style={{ padding: '12px var(--spacing-md)' }}>Version</th>
                <th style={{ padding: '12px var(--spacing-md)' }}>Release Note</th>
                <th style={{ padding: '12px var(--spacing-md)' }}>Date</th>
                <th style={{ padding: '12px var(--spacing-md)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buildHistory.map((build) => {
                const project = projects.find((p) => p.id === build.projectId);
                return (
                  <tr key={build.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px var(--spacing-md)' }}>
                      {build.status === 'success' ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-xs)',
                            color: 'var(--color-success)',
                          }}
                        >
                          <CheckCircle2 size={16} />
                          <span>Success</span>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-xs)',
                            color: 'var(--color-error)',
                          }}
                        >
                          <XCircle size={16} />
                          <span>Failed</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px var(--spacing-md)', fontWeight: 500 }}>
                      {project?.name || 'Unknown'}
                    </td>
                    <td style={{ padding: '12px var(--spacing-md)' }}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
                      >
                        {build.platform === 'ios' ? <Apple size={14} /> : <Smartphone size={14} />}
                        <span style={{ textTransform: 'capitalize' }}>{build.platform}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px var(--spacing-md)' }}>
                      v{build.version} ({build.buildNumber})
                    </td>
                    <td style={{ padding: '12px var(--spacing-md)', maxWidth: '200px' }}>
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
                        {build.releaseNote || '-'}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '12px var(--spacing-md)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {new Date(build.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px var(--spacing-md)', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
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
                            style={{ padding: '4px' }}
                          >
                            <FolderOpen size={16} />
                          </button>
                        )}
                        {build.logFilePath && (
                          <button
                            className="btn btn-ghost"
                            title="Open Log File"
                            onClick={() => {
                              import('@tauri-apps/api/core').then(({ invoke }) => {
                                invoke('open_log_file', {
                                  logFilePath: build.logFilePath,
                                }).catch((err) => console.error(err));
                              });
                            }}
                            style={{ padding: '4px' }}
                          >
                            <FileText size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
