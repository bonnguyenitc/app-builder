import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { DoctorResult, DoctorCheck } from '../types/doctor';
import {
  StethoscopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  LoaderIcon,
  TerminalIcon,
  SparklesIcon,
} from '../components/Icons';

export const Doctor: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DoctorResult | null>(null);
  const [fixing, setFixing] = useState<string | null>(null);
  const [fixOutput, setFixOutput] = useState<{ id: string; output: string } | null>(null);

  const runChecks = async () => {
    setLoading(true);
    setFixOutput(null);
    try {
      const res = await invoke<DoctorResult>('run_doctor_checks');
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runChecks();
  }, []);

  const handleFix = async (check: DoctorCheck) => {
    if (!check.fix_command) return;
    setFixing(check.id);
    setFixOutput(null);
    try {
      const output = await invoke<string>('run_fix_command', { commandStr: check.fix_command });
      setFixOutput({ id: check.id, output });
      // Re-run checks to verify fix
      await runChecks();
    } catch (err) {
      setFixOutput({ id: check.id, output: `Error: ${err}` });
    } finally {
      setFixing(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Success':
        return <CheckCircleIcon size={24} color="var(--color-success)" />;
      case 'Error':
        return <XCircleIcon size={24} color="var(--color-error)" />;
      case 'Warning':
        return <AlertCircleIcon size={24} color="var(--color-warning)" />;
      default:
        return <LoaderIcon size={24} className="animate-spin" />;
    }
  };

  return (
    <div>
      <div
        style={{
          marginBottom: 'var(--spacing-xl)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              marginBottom: '4px',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <StethoscopeIcon size={32} />
            Environment Doctor
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Diagnose and fix common environment issues
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={runChecks}
          disabled={loading}
          style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
        >
          {loading ? <LoaderIcon className="animate-spin" size={18} /> : <SparklesIcon size={18} />}
          {loading ? 'Diagnosing...' : 'Run Checkup'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {result?.checks.map((check) => (
          <div
            key={check.id}
            className="card"
            style={{
              display: 'flex',
              alignItems: 'start',
              padding: 'var(--spacing-lg)',
              gap: 'var(--spacing-md)',
              borderLeft:
                check.status === 'Error'
                  ? '4px solid var(--color-error)'
                  : check.status === 'Warning'
                    ? '4px solid var(--color-warning)'
                    : '4px solid var(--color-success)',
            }}
          >
            <div style={{ marginTop: '2px' }}>{getStatusIcon(check.status)}</div>

            <div style={{ flex: 1 }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>{check.name}</h3>
                {check.status === 'Error' && <span className="badge badge-error">Missing</span>}
              </div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>
                {check.message}
              </p>

              {/* Fix Output Section */}
              {fixOutput && fixOutput.id === check.id && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: '#1e1e1e',
                    borderRadius: '6px',
                    color: '#d4d4d4',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {fixOutput.output}
                </div>
              )}
            </div>

            {check.status === 'Error' && check.fix_command && (
              <button
                className="btn btn-secondary"
                onClick={() => handleFix(check)}
                disabled={fixing === check.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  fontSize: '13px',
                }}
              >
                {fixing === check.id ? (
                  <LoaderIcon className="animate-spin" size={14} />
                ) : (
                  <TerminalIcon size={14} />
                )}
                {fixing === check.id ? 'Fixing...' : 'Quick Fix'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
