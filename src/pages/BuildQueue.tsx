import React from 'react';
import { useBuildStore } from '../stores/buildStore';
import { useProjectStore } from '../stores/projectStore';
import { Terminal, Box, Clock } from 'lucide-react';

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
            return (
              <div key={build.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
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
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm)',
                      marginBottom: 'var(--spacing-sm)',
                      color: '#86868b',
                    }}
                  >
                    <Terminal size={12} />
                    <span>Build Logs</span>
                  </div>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{build.logs}</pre>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
