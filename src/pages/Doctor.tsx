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
  ActivityIcon,
  ShieldCheckIcon,
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
      await runChecks();
    } catch (err) {
      setFixOutput({ id: check.id, output: `Error: ${err}` });
    } finally {
      setFixing(null);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Success':
        return {
          icon: <CheckCircleIcon size={22} />,
          color: 'var(--color-success)',
          bg: 'rgba(52, 199, 89, 0.1)',
          glow: 'rgba(52, 199, 89, 0.2)',
        };
      case 'Error':
        return {
          icon: <XCircleIcon size={22} />,
          color: 'var(--color-error)',
          bg: 'rgba(255, 59, 48, 0.1)',
          glow: 'rgba(255, 59, 48, 0.2)',
        };
      case 'Warning':
        return {
          icon: <AlertCircleIcon size={22} />,
          color: 'var(--color-warning)',
          bg: 'rgba(255, 149, 0, 0.1)',
          glow: 'rgba(255, 149, 0, 0.2)',
        };
      default:
        return {
          icon: <LoaderIcon size={22} className="animate-spin" />,
          color: 'var(--color-text-tertiary)',
          bg: 'var(--color-sidebar)',
          glow: 'transparent',
        };
    }
  };

  const successCount = result?.checks.filter((c) => c.status === 'Success').length || 0;
  const totalCount = result?.checks.length || 0;

  return (
    <div
      className="page-container"
      style={{
        padding: 'var(--spacing-2xl)',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        maxWidth: '1400px',
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
                backgroundColor: 'rgba(255, 45, 85, 0.1)',
                color: '#FF2D55',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Diagnostic Center
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
            Environment Doctor
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', marginTop: '4px' }}>
            Continuous monitoring and automated repair of your development orbit.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--color-text-tertiary)',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              System Health
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color:
                  successCount === totalCount ? 'var(--color-success)' : 'var(--color-warning)',
              }}
            >
              {totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0}%
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={runChecks}
            disabled={loading}
            style={{
              height: '48px',
              padding: '0 24px',
              borderRadius: '14px',
              fontSize: '14px',
              fontWeight: 700,
              boxShadow: '0 8px 24px rgba(0, 122, 255, 0.2)',
            }}
          >
            {loading ? (
              <LoaderIcon className="animate-spin" size={18} />
            ) : (
              <ActivityIcon size={18} />
            )}
            <span>{loading ? 'Analyzing...' : 'Run Diagnostics'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area - Split Viewport */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '32px',
          minHeight: 0,
          animation: 'fadeIn 0.6s ease',
        }}
      >
        {/* Left Column: List of Checks */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto',
            paddingRight: '8px',
            minHeight: 0,
          }}
        >
          {result?.checks.map((check, index) => {
            const config = getStatusConfig(check.status);
            return (
              <div
                key={check.id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '20px 24px',
                  gap: '20px',
                  borderRadius: '20px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-card)',
                  animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s both`,
                  transition: 'all 0.2s ease',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = config.color;
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: config.bg,
                    color: config.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {config.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '2px',
                    }}
                  >
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>{check.name}</h3>
                    {check.status !== 'Success' && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: config.bg,
                          color: config.color,
                          textTransform: 'uppercase',
                        }}
                      >
                        {check.status}
                      </span>
                    )}
                  </div>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', margin: 0 }}>
                    {check.message}
                  </p>
                </div>

                {check.status === 'Error' && check.fix_command && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleFix(check)}
                    disabled={fixing === check.id}
                    style={{
                      height: '40px',
                      padding: '0 16px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 700,
                      gap: '8px',
                    }}
                  >
                    {fixing === check.id ? (
                      <LoaderIcon className="animate-spin" size={14} />
                    ) : (
                      <TerminalIcon size={14} />
                    )}
                    {fixing === check.id ? 'Fixing...' : 'Auto Fix'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Details & Terminal Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minHeight: 0 }}>
          {/* Summary Card */}
          <div
            className="card"
            style={{
              padding: '24px',
              borderRadius: '24px',
              border: '1px solid var(--color-border)',
              background:
                'linear-gradient(135deg, var(--color-card) 0%, rgba(255,255,255,0.02) 100%)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>
              Checkup Summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  Passed Checks
                </span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-success)' }}>
                  {successCount} / {totalCount}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  background: 'var(--color-sidebar)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${(successCount / totalCount) * 100}%`,
                    height: '100%',
                    background: 'var(--color-success)',
                    transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: '12px',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '16px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                }}
              >
                <ShieldCheckIcon
                  size={20}
                  style={{
                    color:
                      successCount === totalCount ? 'var(--color-success)' : 'var(--color-warning)',
                  }}
                />
                <span
                  style={{
                    fontSize: '13px',
                    lineHeight: 1.4,
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {successCount === totalCount
                    ? 'Your environment is healthy and ready for production builds.'
                    : `${totalCount - successCount} issue(s) detected. Please address them to ensure stable operations.`}
                </span>
              </div>
            </div>
          </div>

          {/* Terminal Output Layer */}
          <div
            className="card"
            style={{
              flex: 1,
              padding: '24px',
              borderRadius: '24px',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: '#0D0F12',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}
            >
              <TerminalIcon size={16} style={{ color: 'var(--color-text-tertiary)' }} />
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  color: 'var(--color-text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Fix Log
              </h3>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontSize: '12px',
                lineHeight: 1.6,
                color: '#A9B1D6',
              }}
            >
              {fixOutput ? (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ color: 'var(--color-primary)', marginBottom: '8px' }}>
                    $ {fixing || 'repair-cmd'} --verbose
                  </div>
                  {fixOutput.output}
                </div>
              ) : (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-text-tertiary)',
                    opacity: 0.5,
                  }}
                >
                  Waiting for repair operations...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
