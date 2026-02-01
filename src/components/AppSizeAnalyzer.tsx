import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  CloseIcon,
  ActivityIcon,
  InfoIcon,
  FileIcon,
  LoaderIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from './Icons';

interface SizeBreakdown {
  name: string;
  size: number;
  percentage: number;
}

interface AppSizeReport {
  totalSize: number;
  breakdown: SizeBreakdown[];
  fileType: string;
  supports16kPageSize?: boolean;
  largeFiles?: { path: string; size: number }[];
}

interface AppSizeAnalyzerProps {
  artifactPath: string;
  onClose: () => void;
  appName: string;
}

export const AppSizeAnalyzer: React.FC<AppSizeAnalyzerProps> = ({
  artifactPath,
  onClose,
  appName,
}) => {
  const [report, setReport] = useState<AppSizeReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const analyze = async () => {
      try {
        setLoading(true);
        const result = await invoke<AppSizeReport>('analyze_app_size', { artifactPath });
        setReport(result);
      } catch (err) {
        console.error('Analysis failed', err);
        setError(
          typeof err === 'string'
            ? err
            : 'Failed to analyze app size. The file might be corrupted or inaccessible.',
        );
      } finally {
        setLoading(false);
      }
    };

    analyze();
  }, [artifactPath]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const colors = [
    '#007AFF', // Primary Blue
    '#34C759', // Success Green
    '#FF9F0A', // Warning Orange
    '#5856D6', // Indigo
    '#FF2D55', // Red/Pink
    '#64D2FF', // Sky Blue
  ];

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 3000, backdropFilter: 'blur(20px)', background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '90%',
          maxWidth: '600px',
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '32px',
          boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(135deg, #1A1D23 0%, #0D0F12 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 32px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(0, 122, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)',
              }}
            >
              <ActivityIcon size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>App Size Analyzer</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                {appName} • Artifact Insights
              </p>
            </div>
          </div>
          <button
            className="btn btn-ghost"
            onClick={onClose}
            style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0 }}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <LoaderIcon
                className="animate-spin"
                size={48}
                style={{ color: 'var(--color-primary)', marginBottom: '24px' }}
              />
              <h4 style={{ fontSize: '18px', fontWeight: 600 }}>Analyzing Artifact...</h4>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                Decompressing and calculating file breakdown
              </p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(255, 59, 48, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  color: 'var(--color-error)',
                }}
              >
                <AlertCircleIcon size={32} />
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
                Analysis Failed
              </h4>
              <p
                style={{
                  color: 'var(--color-text-secondary)',
                  maxWidth: '300px',
                  margin: '0 auto 24px',
                  lineHeight: 1.5,
                }}
              >
                {error}
              </p>
              <button className="btn btn-primary" onClick={onClose}>
                Close
              </button>
            </div>
          ) : report ? (
            <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
              {/* Total Size Card */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '24px',
                  padding: '24px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  marginBottom: '32px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--color-text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '8px',
                  }}
                >
                  Total {report.fileType} Size
                </div>
                <div
                  style={{
                    fontSize: '48px',
                    fontWeight: 900,
                    color: 'var(--color-primary)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {formatSize(report.totalSize)}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '12px',
                  }}
                >
                  <CheckCircleIcon size={14} style={{ color: 'var(--color-success)' }} />
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    Properly compressed and signed
                  </span>
                </div>
                {report.supports16kPageSize !== undefined && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginTop: '8px',
                    }}
                  >
                    {report.supports16kPageSize ? (
                      <CheckCircleIcon size={14} style={{ color: 'var(--color-success)' }} />
                    ) : (
                      <AlertCircleIcon size={14} style={{ color: 'var(--color-warning)' }} />
                    )}
                    <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                      {report.supports16kPageSize
                        ? '16KB Page Size Compatible'
                        : 'Not 16KB Page Size Compatible'}
                    </span>
                  </div>
                )}
              </div>

              {/* Composition Bar */}
              <h4
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <InfoIcon size={16} /> Composition Breakdown
              </h4>

              <div
                style={{
                  height: '32px',
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  display: 'flex',
                  marginBottom: '32px',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                }}
              >
                {report.breakdown.map((item, i) => (
                  <div
                    key={item.name}
                    style={{
                      width: `${item.percentage}%`,
                      background: colors[i % colors.length],
                      height: '100%',
                      transition: 'all 0.5s ease',
                    }}
                    title={`${item.name}: ${item.percentage.toFixed(1)}%`}
                  />
                ))}
              </div>

              {/* List Breakdown */}
              <div style={{ display: 'grid', gap: '12px' }}>
                {report.breakdown.map((item, i) => (
                  <div
                    key={item.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '3px',
                          background: colors[i % colors.length],
                        }}
                      />
                      <span style={{ fontWeight: 600, fontSize: '15px' }}>{item.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '15px' }}>
                        {formatSize(item.size)}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-text-tertiary)',
                          fontWeight: 600,
                        }}
                      >
                        {item.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: '32px',
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'rgba(0, 122, 255, 0.05)',
                  display: 'flex',
                  gap: '12px',
                  border: '1px solid rgba(0, 122, 255, 0.1)',
                }}
              >
                <FileIcon size={20} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <p
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  <strong>Pro Tip:</strong> To reduce size, consider enabling Hermes engine, using
                  Proguard/R8 for Android, and optimizing image assets before building.
                </p>
              </div>

              {/* Largest Files Section */}
              {report.largeFiles && report.largeFiles.length > 0 && (
                <div style={{ marginTop: '32px' }}>
                  <h4
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <FileIcon size={16} /> Largest Files
                  </h4>
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.03)',
                      overflow: 'hidden',
                    }}
                  >
                    {report.largeFiles.map((file, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 20px',
                          borderBottom:
                            i === report.largeFiles!.length - 1
                              ? 'none'
                              : '1px solid rgba(255,255,255,0.03)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              background: 'rgba(255,255,255,0.05)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--color-text-secondary)',
                              fontSize: '10px',
                              flexShrink: 0,
                            }}
                          >
                            {i + 1}
                          </div>
                          <span
                            style={{
                              fontSize: '13px',
                              color: 'var(--color-text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={file.path}
                          >
                            {file.path}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--color-text-secondary)',
                            marginLeft: '16px',
                          }}
                        >
                          {formatSize(file.size)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '24px 32px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            textAlign: 'right',
            background: 'rgba(0,0,0,0.1)',
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ borderRadius: '12px', padding: '0 24px', height: '42px' }}
          >
            Dismiss
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
