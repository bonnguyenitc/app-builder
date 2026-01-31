import React, { useEffect, useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { EraserIcon, LoaderIcon, CheckCircleIcon, XCircleIcon, TerminalIcon } from './Icons';
import { Project } from '../types/project';

interface DeepCleanModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DeepCleanModal: React.FC<DeepCleanModalProps> = ({ project, isOpen, onClose }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [isCleaning, setIsCleaning] = useState(false);

  // Cleanup listeners on unmount
  const unlistenRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    return () => {
      unlistenRef.current.forEach((u) => u());
      unlistenRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (isOpen && project) {
      // Reset state when opening
      setLogs([]);
      setStatus('running');
      setIsCleaning(true);
      startDeepClean(project);
    }
  }, [isOpen, project]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const startDeepClean = async (currentProject: Project) => {
    // Clear previous listeners
    unlistenRef.current.forEach((u) => u());
    unlistenRef.current = [];

    const unlistenLog = await listen<string>('maintenance-log', (event) => {
      setLogs((prev) => [...prev, event.payload]);
    });
    unlistenRef.current.push(unlistenLog);

    const unlistenStatus = await listen<string>('maintenance-status', (event) => {
      setStatus(event.payload as any);
      setIsCleaning(false);
    });
    unlistenRef.current.push(unlistenStatus);

    try {
      await invoke('deep_clean_project', { projectPath: currentProject.path });
    } catch (err) {
      console.error(err);
      setLogs((prev) => [...prev, `❌ Error: ${err}`]);
      setStatus('failed');
      setIsCleaning(false);
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div
      className="modal-overlay"
      style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        className="card modal-content"
        style={{
          maxWidth: '650px',
          width: '90%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--glass-bg-strong)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 24px 20px',
            borderBottom: '1px solid var(--color-border)',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.02), transparent)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #FF9F0A 0%, #FF3B30 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(255, 59, 48, 0.25)',
                flexShrink: 0,
              }}
            >
              <EraserIcon size={24} color="white" />
            </div>
            <div>
              <h3
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  margin: '0 0 4px',
                  color: 'var(--color-text-primary)',
                }}
              >
                Deep Clean Project
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
                Restoring{' '}
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                  {project.name}
                </span>{' '}
                to a clean state
              </p>
            </div>
          </div>
        </div>

        {/* Terminal/Logs Area */}
        <div
          style={{
            flex: 1,
            padding: '24px',
            backgroundColor: 'var(--color-bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-text-tertiary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TerminalIcon size={14} />
              <span>Process Log</span>
            </div>
            {isCleaning && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--color-primary)',
                }}
              >
                <span
                  className="animate-pulse"
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'currentColor',
                  }}
                ></span>
                Running...
              </div>
            )}
          </div>

          <div
            style={{
              flex: 1,
              background: '#0D1117',
              borderRadius: '12px',
              padding: '16px',
              overflowY: 'auto',
              fontFamily: "'JetBrains Mono', 'SF Mono', Consolas, Menlo, monospace",
              fontSize: '13px',
              color: '#C9D1D9',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
              minHeight: '300px',
            }}
          >
            {logs.length === 0 && (
              <div style={{ color: '#8B949E', fontStyle: 'italic' }}>
                Initializing cleaning sequence...
              </div>
            )}
            {logs.map((log, i) => (
              <div
                key={i}
                style={{
                  marginBottom: '6px',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.5',
                  color: log.includes('❌')
                    ? '#F85149'
                    : log.includes('✅')
                      ? '#3FB950'
                      : log.includes('Run')
                        ? '#58A6FF'
                        : 'inherit',
                }}
              >
                {log.startsWith('Run') && (
                  <span style={{ color: '#8B949E', marginRight: '8px' }}>$</span>
                )}
                {log}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '20px 24px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--color-bg-primary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {status === 'success' && (
              <>
                <CheckCircleIcon size={18} color="var(--color-success)" />
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-success)' }}>
                  Clean Successful
                </span>
              </>
            )}
            {status === 'failed' && (
              <>
                <XCircleIcon size={18} color="var(--color-error)" />
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-error)' }}>
                  Clean Failed
                </span>
              </>
            )}
          </div>

          <button
            className={`btn ${isCleaning ? 'btn-secondary' : 'btn-primary'}`}
            onClick={onClose}
            disabled={isCleaning}
            style={{
              minWidth: '100px',
              opacity: isCleaning ? 0.7 : 1,
              cursor: isCleaning ? 'not-allowed' : 'pointer',
            }}
          >
            {isCleaning ? (
              <>
                <LoaderIcon className="animate-spin" size={16} />
                <span>Cleaning...</span>
              </>
            ) : (
              <span>Done</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
