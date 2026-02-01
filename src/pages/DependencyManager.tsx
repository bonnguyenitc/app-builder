import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import {
  PackageIcon,
  ChevronLeftIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  RefreshCwIcon,
  TerminalIcon,
  LoaderIcon,
} from '../components/Icons';
import { useProjectStore } from '../stores/projectStore';

interface DependencyInfo {
  name: string;
  version: string;
  is_dev: boolean;
  latestVersion?: string;
}

interface ProjectDependencies {
  dependencies: DependencyInfo[];
  dev_dependencies: DependencyInfo[];
  package_manager: string;
}

interface NPMPackage {
  name: string;
  version: string;
  description: string;
  publisher: { username: string };
  date: string;
}

export const DependencyManager: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects } = useProjectStore();
  const project = projects.find((p) => p.id === projectId);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProjectDependencies | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'prod' | 'dev' | 'add'>('prod');
  const [newDependency, setNewDependency] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<NPMPackage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (project) fetchDependencies();
  }, [project]);

  useEffect(() => {
    const unlistenLogs = listen('dep-manager-log', (event) => {
      setLogs((prev) => [...prev, event.payload as string]);
    });
    const unlistenStatus = listen('dep-manager-status', (event) => {
      if (event.payload === 'success') {
        setLogs((prev) => [...prev, '✅ Finished successfully!']);
        setIsInstalling(false);
        fetchDependencies();
      } else {
        setLogs((prev) => [...prev, '❌ Process failed.']);
        setIsInstalling(false);
      }
    });

    return () => {
      unlistenLogs.then((u) => u());
      unlistenStatus.then((u) => u());
    };
  }, []);

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Real-time NPM Search logic with debouncing
  useEffect(() => {
    if (activeTab !== 'add' || !newDependency.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await fetch(
          `https://registry.npmjs.com/-/v1/search?text=${encodeURIComponent(newDependency)}&size=8`,
        );
        const result = await response.json();
        setSearchResults(result.objects.map((obj: any) => obj.package));
      } catch (err) {
        console.error('NPM search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [newDependency, activeTab]);

  const fetchDependencies = async () => {
    if (!project) return;
    try {
      setLoading(true);
      const result = await invoke<ProjectDependencies>('get_dependencies', {
        projectPath: project.path,
      });
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const handleInstallDependencies = async () => {
    if (!project || isInstalling) return;
    try {
      setIsInstalling(true);
      setLogs(['🚀 Executing install command...']);
      await invoke('install_dependencies', { projectPath: project.path });
    } catch (err) {
      setError(err as string);
      setIsInstalling(false);
    }
  };

  const handleAddDependency = async (pkgName: string, isDev: boolean) => {
    if (!project || isInstalling) return;
    try {
      setIsInstalling(true);
      setLogs([`🚀 Adding package: ${pkgName}...`]);
      await invoke('add_dependency', {
        projectPath: project.path,
        dependency: pkgName,
        isDev,
      });
      setNewDependency('');
    } catch (err) {
      setError(err as string);
      setIsInstalling(false);
    }
  };

  const handleRemoveDependency = async () => {
    if (!project || !pendingDelete || isInstalling) return;
    const name = pendingDelete;
    setPendingDelete(null);
    try {
      setIsInstalling(true);
      setLogs([`🚀 Removing package: ${name}...`]);
      await invoke('remove_dependency', { projectPath: project.path, dependency: name });
    } catch (err) {
      setError(err as string);
      setIsInstalling(false);
    }
  };

  if (!project) return null;

  const filteredDeps =
    activeTab === 'prod'
      ? data?.dependencies.filter((d) => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
      : data?.dev_dependencies.filter((d) =>
          d.name.toLowerCase().includes(searchTerm.toLowerCase()),
        );

  return (
    <div
      className="page-container"
      style={{
        padding: 'var(--spacing-2xl)',
        height: 'calc(100vh - 40px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Premium Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-lg)',
          marginBottom: '32px',
          flexShrink: 0,
          animation: 'fadeInDown 0.5s ease-out',
        }}
      >
        <button
          className="btn btn-ghost"
          onClick={() => navigate('/')}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            padding: 0,
            background: 'var(--color-sidebar)',
            border: '1px solid var(--color-border)',
          }}
        >
          <ChevronLeftIcon size={20} />
        </button>
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
            Dependencies
          </h1>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--spacing-md)' }}>
          <button
            className="btn btn-secondary"
            onClick={fetchDependencies}
            disabled={loading || isInstalling}
            style={{ height: '42px', borderRadius: '12px' }}
          >
            <RefreshCwIcon size={18} className={loading ? 'animate-spin' : ''} />
            <span>Reload</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={handleInstallDependencies}
            disabled={isInstalling || loading}
            style={{
              height: '42px',
              borderRadius: '12px',
              padding: '0 20px',
              boxShadow: '0 4px 12px rgba(0, 122, 255, 0.2)',
            }}
          >
            <PlusIcon size={18} />
            <span>{data?.package_manager || 'npm'} install</span>
          </button>
        </div>
      </header>

      {error && (
        <div
          style={{
            padding: '16px',
            background: 'rgba(255, 59, 48, 0.08)',
            border: '1px solid rgba(255, 59, 48, 0.2)',
            borderRadius: '16px',
            color: 'var(--color-error)',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <span style={{ fontWeight: 500 }}>{error}</span>
          </div>
          <button
            className="btn btn-ghost"
            onClick={() => setError(null)}
            style={{ color: 'inherit' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 400px',
          gap: '32px',
          flex: 1,
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          {/* Custom Tabs */}
          <div
            className="card"
            style={{
              padding: '8px',
              borderRadius: '16px',
              display: 'flex',
              gap: '4px',
              background: 'var(--color-sidebar)',
              flexShrink: 0,
            }}
          >
            {(['prod', 'dev', 'add'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  height: '40px',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  background: activeTab === tab ? 'var(--color-card)' : 'transparent',
                  color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  boxShadow: activeTab === tab ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {tab === 'prod' ? 'Production' : tab === 'dev' ? 'Development' : 'Add New'}
              </button>
            ))}
          </div>

          {/* List/Form Card */}
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
              minHeight: 0,
            }}
          >
            {activeTab !== 'add' && (
              <div
                className="search-input-wrapper"
                style={{ marginBottom: '24px', position: 'relative', flexShrink: 0 }}
              >
                <SearchIcon
                  size={20}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-secondary)',
                  }}
                />
                <input
                  type="text"
                  className="input"
                  placeholder="Search local dependencies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                  style={{
                    paddingLeft: '48px',
                    height: '50px',
                    borderRadius: '14px',
                    background: 'var(--color-sidebar)',
                    fontSize: '15px',
                  }}
                />
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {activeTab === 'add' ? (
                <div style={{ padding: '20px 0' }}>
                  <div
                    style={{
                      maxWidth: '600px',
                      margin: '0 auto',
                      textAlign: 'center',
                      marginBottom: '32px',
                    }}
                  >
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '20px',
                        background: 'rgba(0, 122, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                      }}
                    >
                      <PackageIcon size={32} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
                      Install New Package
                    </h3>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="input"
                        placeholder="Search NPM registry..."
                        value={newDependency}
                        onChange={(e) => setNewDependency(e.target.value.toLowerCase())}
                        style={{
                          height: '56px',
                          borderRadius: '16px',
                          textAlign: 'center',
                          fontSize: '18px',
                          fontWeight: 500,
                          background: 'var(--color-sidebar)',
                          padding: '0 50px',
                        }}
                      />
                      {isSearching && (
                        <div
                          style={{
                            position: 'absolute',
                            right: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                          }}
                        >
                          <LoaderIcon
                            size={20}
                            className="animate-spin"
                            style={{ color: 'var(--color-primary)' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {searchResults.length > 0 ? (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {searchResults.map((pkg) => (
                        <div
                          key={pkg.name}
                          className="search-result-card"
                          style={{
                            background: 'var(--color-sidebar)',
                            borderRadius: '16px',
                            padding: '16px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '20px',
                            border: '1px solid var(--color-border)',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '4px',
                              }}
                            >
                              <span style={{ fontWeight: 700, fontSize: '16px' }}>{pkg.name}</span>
                              <span
                                style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}
                              >
                                v{pkg.version}
                              </span>
                            </div>
                            <p
                              style={{
                                fontSize: '13px',
                                color: 'var(--color-text-secondary)',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {pkg.description}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ height: '36px', fontSize: '12px', borderRadius: '10px' }}
                              onClick={() => handleAddDependency(pkg.name, false)}
                              disabled={isInstalling}
                            >
                              Prod
                            </button>
                            <button
                              className="btn btn-primary"
                              style={{ height: '36px', fontSize: '12px', borderRadius: '10px' }}
                              onClick={() => handleAddDependency(pkg.name, true)}
                              disabled={isInstalling}
                            >
                              Dev
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : newDependency && !isSearching ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      No packages found for "{newDependency}"
                    </div>
                  ) : null}
                </div>
              ) : (
                <div style={{ minWidth: 'min-content' }}>
                  {loading ? (
                    <div style={{ padding: '100px 0', textAlign: 'center' }}>
                      <LoaderIcon
                        size={40}
                        className="animate-spin"
                        style={{ color: 'var(--color-primary)' }}
                      />
                      <p
                        style={{
                          color: 'var(--color-text-secondary)',
                          marginTop: '16px',
                          fontWeight: 500,
                        }}
                      >
                        Fetching manifest...
                      </p>
                    </div>
                  ) : filteredDeps && filteredDeps.length > 0 ? (
                    <table
                      style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}
                    >
                      <thead
                        style={{
                          position: 'sticky',
                          top: 0,
                          zIndex: 1,
                          background: 'var(--color-card)',
                        }}
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
                          <th style={{ padding: '0 16px 12px', textAlign: 'left' }}>Package</th>
                          <th style={{ padding: '0 16px 12px', textAlign: 'left' }}>Version</th>
                          <th style={{ padding: '0 16px 12px', textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDeps.map((dep) => (
                          <tr
                            key={dep.name}
                            className="table-row-hover"
                            style={{ transition: 'all 0.2s', borderRadius: '12px' }}
                          >
                            <td
                              style={{
                                padding: '16px',
                                background: 'var(--color-sidebar)',
                                borderTopLeftRadius: '12px',
                                borderBottomLeftRadius: '12px',
                                fontWeight: 600,
                                fontSize: '15px',
                              }}
                            >
                              {dep.name}
                            </td>
                            <td style={{ padding: '16px', background: 'var(--color-sidebar)' }}>
                              <span
                                style={{
                                  background: 'rgba(0,0,0,0.2)',
                                  padding: '4px 10px',
                                  borderRadius: '8px',
                                  fontSize: '13px',
                                  fontFamily: 'monospace',
                                  color: 'var(--color-primary)',
                                }}
                              >
                                {dep.version}
                              </span>
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
                              <button
                                className="btn btn-ghost"
                                style={{
                                  color: 'var(--color-error)',
                                  opacity: 0.6,
                                  padding: '8px',
                                }}
                                onClick={() => setPendingDelete(dep.name)}
                                disabled={isInstalling}
                              >
                                <TrashIcon size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: '80px 0', textAlign: 'center' }}>
                      <div style={{ marginBottom: '16px', opacity: 0.2 }}>
                        <SearchIcon size={48} />
                      </div>
                      <p style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                        No results found.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Console / Terminal Section */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <div
            className="card"
            style={{
              borderRadius: '24px',
              background: '#0D0F12',
              border: '1px solid #1A1D23',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              minHeight: 0,
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                background: '#15181E',
                borderBottom: '1px solid #1A1D23',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexShrink: 0,
              }}
            >
              <TerminalIcon size={16} style={{ color: '#888' }} />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#AAA',
                  letterSpacing: '0.02em',
                }}
              >
                PROCESS LOGS
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ff5f56',
                  }}
                ></div>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ffbd2e',
                  }}
                ></div>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#27c93f',
                  }}
                ></div>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                padding: '20px',
                overflowY: 'auto',
                fontFamily: '"SF Mono", "Fira Code", monospace',
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#E0E0E0',
              }}
            >
              {logs.length === 0 ? (
                <span style={{ color: '#444', fontStyle: 'italic' }}>Waiting for input...</span>
              ) : (
                logs.map((log, i) => {
                  let color = '#E0E0E0';
                  if (log.startsWith('🚀')) color = 'var(--color-primary)';
                  if (log.startsWith('✅')) color = 'var(--color-success)';
                  if (log.startsWith('❌')) color = 'var(--color-error)';
                  if (log.startsWith('⚠️')) color = 'var(--color-warning)';

                  return (
                    <div
                      key={i}
                      style={{ color, paddingBottom: '4px', borderBottom: '1px solid #15181E' }}
                    >
                      {log}
                    </div>
                  );
                })
              )}
              <div ref={logEndRef} />
            </div>

            {isInstalling && (
              <div
                style={{
                  padding: '16px 20px',
                  background: '#15181E',
                  borderTop: '1px solid #1A1D23',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexShrink: 0,
                }}
              >
                <LoaderIcon
                  size={16}
                  className="animate-spin"
                  style={{ color: 'var(--color-primary)' }}
                />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)' }}>
                  RUNNING COMMAND...
                </span>
              </div>
            )}
          </div>

          <div
            className="card"
            style={{
              borderRadius: '24px',
              padding: '24px',
              background:
                'linear-gradient(135deg, rgba(0, 122, 255, 0.08) 0%, rgba(0, 122, 255, 0.02) 100%)',
              border: '1px solid rgba(0, 122, 255, 0.1)',
              flexShrink: 0,
            }}
          >
            <h4
              style={{
                fontSize: '14px',
                fontWeight: 800,
                textTransform: 'uppercase',
                color: 'var(--color-primary)',
                letterSpacing: '0.05em',
                marginBottom: '16px',
              }}
            >
              Environment
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Manager</span>
                <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                  {data?.package_manager.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Lock file</span>
                <span style={{ color: 'var(--color-text)' }}>
                  {data?.package_manager === 'yarn' ? 'yarn.lock' : 'package-lock.json'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Status</span>
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Confirmation Modal */}
      {pendingDelete && (
        <div
          className="modal-overlay"
          style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setPendingDelete(null)}
        >
          <div
            className="card modal-content"
            style={{
              maxWidth: '440px',
              padding: '32px',
              borderRadius: '28px',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
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
              <TrashIcon size={32} style={{ color: 'var(--color-error)' }} />
            </div>
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 800,
                marginBottom: '12px',
                textAlign: 'center',
              }}
            >
              Remove Package?
            </h2>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                marginBottom: '32px',
                textAlign: 'center',
                lineHeight: 1.6,
                fontSize: '16px',
              }}
            >
              Are you sure you want to uninstall{' '}
              <strong style={{ color: 'var(--color-text)' }}>{pendingDelete}</strong>? This will
              modify your package.json.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setPendingDelete(null)}
                style={{ flex: 1, height: '48px', borderRadius: '14px' }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleRemoveDependency}
                style={{
                  flex: 1,
                  height: '48px',
                  borderRadius: '14px',
                  background: 'var(--color-error)',
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .table-row-hover:hover td {
          background: var(--color-border) !important;
          transform: scale(1.002);
        }
        .search-result-card:hover {
          border-color: var(--color-primary) !important;
          background: var(--color-card) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
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
