import React, { useEffect, useState, useCallback } from 'react';
import {
  CloseIcon,
  FolderIcon,
  PlayIcon,
  CheckCircleIcon,
  TerminalIcon,
  AlertCircleIcon,
} from '../components/Icons';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { listen } from '@tauri-apps/api/event';

type ProjectType = 'react-native' | 'expo';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

interface CreateProjectProgress {
  stage: string;
  message: string;
  is_complete: boolean;
  is_error: boolean;
}

// Initial fallback versions while fetching
const DEFAULT_RN_VERSIONS = ['0.77', '0.76', '0.75', '0.74', '0.73'] as const;
const DEFAULT_EXPO_VERSIONS = ['52.0.0', '51.0.0', '50.0.0'] as const;
const EXPO_TEMPLATES = [
  {
    value: 'default',
    label: 'Default (Router + Tabs)',
    desc: 'Multi-screen using Expo Router and TypeScript',
  },
  { value: 'blank', label: 'Blank', desc: 'Minimal template with no navigation' },
  { value: 'blank-typescript', label: 'Blank (TypeScript)', desc: 'Minimal TypeScript template' },
  { value: 'tabs', label: 'Tabs', desc: 'Managed tabs navigation with TypeScript' },
  { value: 'bare-minimum', label: 'Bare Minimum', desc: 'Minimum setup with native directories' },
] as const;

const sectionStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.15)',
  borderRadius: '16px',
  padding: '20px',
  marginBottom: '16px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  marginBottom: '4px',
  display: 'block',
};

const inputStyle: React.CSSProperties = {
  height: '40px',
  fontSize: '14px',
  borderRadius: '10px',
  background: 'var(--color-sidebar)',
  border: '1px solid var(--color-border)',
  padding: '0 12px',
  width: '100%',
  color: '#ffffff',
  outline: 'none',
};

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const [projectType, setProjectType] = useState<ProjectType>('react-native');
  const [projectName, setProjectName] = useState('');
  const [appTitle, setAppTitle] = useState('');
  const [packageName, setPackageName] = useState('');
  const [targetPath, setTargetPath] = useState('');

  // React Native specific
  const [rnVersion, setRnVersion] = useState<string>('');
  const [rnTemplate, setRnTemplate] = useState('');
  const [rnPackageManager, setRnPackageManager] = useState<'npm' | 'yarn' | 'bun'>('yarn');
  const [rnSkipInstall, setRnSkipInstall] = useState(false);
  const [rnInstallPods, setRnInstallPods] = useState<boolean | null>(null);
  const [skipGitInit, setSkipGitInit] = useState(false);

  // Expo specific
  const [expoTemplate, setExpoTemplate] = useState<string>('default');
  const [expoVersion, setExpoVersion] = useState<string>('');
  const [expoPackageManager, setExpoPackageManager] = useState<'npm' | 'yarn' | 'pnpm' | 'bun'>(
    'npm',
  );
  const [expoNoGit, setExpoNoGit] = useState(false);
  const [expoNoInstall, setExpoNoInstall] = useState(false);

  // Versions state
  const [rnVersions, setRnVersions] = useState<string[]>([...DEFAULT_RN_VERSIONS]);
  const [expoVersions, setExpoVersions] = useState<string[]>([...DEFAULT_EXPO_VERSIONS]);

  // Creation state
  const [isCreating, setIsCreating] = useState(false);
  const [creationLogs, setCreationLogs] = useState<string[]>([]);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [creationSuccess, setCreationSuccess] = useState(false);

  const resetForm = useCallback(() => {
    setProjectType('react-native');
    setProjectName('');
    setAppTitle('');
    setPackageName('');
    setTargetPath('');
    setRnVersion('');
    setRnTemplate('');
    setRnPackageManager('yarn');
    setRnSkipInstall(false);
    setRnInstallPods(null);
    setSkipGitInit(false);
    setExpoTemplate('default');
    setExpoVersion('');
    setExpoPackageManager('npm');
    setExpoNoGit(false);
    setExpoNoInstall(false);
    setIsCreating(false);
    setCreationLogs([]);
    setCreationError(null);
    setCreationSuccess(false);
  }, []);

  // Helper to map template value to npm package for version fetching
  const getPackageForTemplate = (template: string) => {
    switch (template) {
      case 'default':
        return 'expo'; // Use expo package as base for 'default'
      case 'blank':
        return 'expo-template-blank';
      case 'blank-typescript':
        return 'expo-template-blank-typescript';
      case 'tabs':
        return 'expo-template-tabs';
      case 'bare-minimum':
        return 'expo-template-bare-minimum';
      default:
        return 'expo';
    }
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
      // Fetch latest RN versions
      invoke<string[]>('get_package_versions', { package: 'react-native' })
        .then(setRnVersions)
        .catch(console.error);
    }
  }, [isOpen, resetForm]);

  useEffect(() => {
    if (isOpen) {
      const pkg = getPackageForTemplate(expoTemplate);
      invoke<string[]>('get_package_versions', { package: pkg })
        .then((v) => {
          const filtered = v.filter((ver) => parseInt(ver.split('.')[0]) >= 40);
          setExpoVersions(filtered);
          // If current version is not in new list, reset it
          if (expoVersion && !filtered.includes(expoVersion)) {
            setExpoVersion('');
          }
        })
        .catch(console.error);
    }
  }, [isOpen, expoTemplate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isCreating) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isCreating]);

  // Listen for progress events
  useEffect(() => {
    if (!isCreating) return;

    const unlisten = listen<CreateProjectProgress>('create-project-progress', (event) => {
      const { stage, message, is_complete, is_error } = event.payload;

      setCreationLogs((prev) => [...prev.slice(-100), `[${stage}] ${message}`]); // Limit logs

      if (is_error) {
        setCreationError(message);
        setIsCreating(false);
      } else if (is_complete) {
        setCreationSuccess(true);
        setIsCreating(false);
        onProjectCreated();
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [isCreating, onProjectCreated]);

  const handleBrowse = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Select project location',
    });
    if (selected) {
      setTargetPath(selected as string);
    }
  };

  const handleCreate = async () => {
    if (!projectName || !targetPath) return;

    setIsCreating(true);
    setCreationLogs([]);
    setCreationError(null);
    setCreationSuccess(false);

    try {
      if (projectType === 'react-native') {
        await invoke('create_react_native_project', {
          projectName,
          targetPath,
          packageName: packageName || null,
          appTitle: appTitle || null,
          version: rnVersion || null,
          template: rnTemplate || null,
          packageManager: rnPackageManager,
          skipInstall: rnSkipInstall,
          installPods: rnInstallPods,
          skipGitInit: skipGitInit,
        });
      } else {
        await invoke('create_expo_project', {
          projectName,
          targetPath,
          packageName: packageName || null,
          appTitle: appTitle || null,
          template: expoTemplate,
          version: expoVersion || null,
          packageManager: expoPackageManager,
          noGit: expoNoGit,
          noInstall: expoNoInstall,
        });
      }
    } catch (err) {
      setCreationError(String(err));
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => !isCreating && onClose()}>
      <div
        className="card modal-content"
        style={{
          width: '720px',
          maxHeight: '90vh',
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--spacing-md) var(--spacing-lg)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--color-sidebar)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TerminalIcon size={20} style={{ color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Create New Project</h2>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                Initialize a new React Native or Expo project
              </p>
            </div>
          </div>
          <button
            onClick={() => !isCreating && onClose()}
            className="btn btn-ghost"
            disabled={isCreating}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              opacity: isCreating ? 0.5 : 1,
            }}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {!isCreating && !creationSuccess && (
            <>
              {/* Project Type Selector */}
              <div style={sectionStyle}>
                <label style={labelStyle}>Framework</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setProjectType('react-native')}
                    style={{
                      flex: 1,
                      padding: '16px',
                      borderRadius: '12px',
                      border: `2px solid ${projectType === 'react-native' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background:
                        projectType === 'react-native' ? 'rgba(0, 122, 255, 0.1)' : 'transparent',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      color:
                        projectType === 'react-native' ? '#ffffff' : 'var(--color-text-secondary)',
                    }}
                  >
                    <span style={{ fontSize: '28px' }}>⚛️</span>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>React Native CLI</span>
                    <span style={{ fontSize: '11px', opacity: 0.8 }}>Full native control</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProjectType('expo')}
                    style={{
                      flex: 1,
                      padding: '16px',
                      borderRadius: '12px',
                      border: `2px solid ${projectType === 'expo' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: projectType === 'expo' ? 'rgba(0, 122, 255, 0.1)' : 'transparent',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      color: projectType === 'expo' ? '#ffffff' : 'var(--color-text-secondary)',
                    }}
                  >
                    <span style={{ fontSize: '28px' }}>📱</span>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>Expo</span>
                    <span style={{ fontSize: '11px', opacity: 0.8 }}>
                      Managed workflow (Recommended)
                    </span>
                  </button>
                </div>
              </div>

              {/* Basic Info */}
              <div style={sectionStyle}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Project Name (Folder) *</label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) =>
                        setProjectName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))
                      }
                      placeholder="MyAwesomeApp"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>App Title (Visible Name)</label>
                    <input
                      type="text"
                      value={appTitle}
                      onChange={(e) => setAppTitle(e.target.value)}
                      placeholder="My Awesome App"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <label style={labelStyle}>Package Name / Bundle ID</label>
                  <input
                    type="text"
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    placeholder="com.company.myapp"
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginTop: '16px' }}>
                  <label style={labelStyle}>Target Location *</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={targetPath}
                      onChange={(e) => setTargetPath(e.target.value)}
                      placeholder="/Users/you/projects"
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={handleBrowse}
                      className="btn btn-secondary"
                      style={{ height: '40px', padding: '0 16px' }}
                    >
                      <FolderIcon size={16} />
                      <span>Browse</span>
                    </button>
                  </div>
                  {targetPath && projectName && (
                    <p
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-text-secondary)',
                        marginTop: '6px',
                      }}
                    >
                      Project will be created at:{' '}
                      <code
                        style={{
                          background: 'rgba(0,0,0,0.3)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {targetPath}/{projectName}
                      </code>
                    </p>
                  )}
                </div>
              </div>

              {/* React Native Options */}
              {projectType === 'react-native' && (
                <div style={sectionStyle}>
                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>⚛️</span> CLI Options
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={labelStyle}>RN Version</label>
                      <select
                        value={rnVersion}
                        onChange={(e) => setRnVersion(e.target.value)}
                        style={inputStyle}
                      >
                        <option value="">Latest</option>
                        {rnVersions.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Package Manager</label>
                      <select
                        value={rnPackageManager}
                        onChange={(e) => setRnPackageManager(e.target.value as any)}
                        style={inputStyle}
                      >
                        <option value="yarn">Yarn (Classic)</option>
                        <option value="npm">npm</option>
                        <option value="bun">Bun</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <label style={labelStyle}>Custom Template (npm/git/local)</label>
                    <input
                      type="text"
                      value={rnTemplate}
                      onChange={(e) => setRnTemplate(e.target.value)}
                      placeholder="e.g. ignite-cli"
                      style={inputStyle}
                    />
                  </div>

                  <div
                    style={{
                      marginTop: '16px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                    }}
                  >
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '8px 4px',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={rnSkipInstall}
                        onChange={(e) => setRnSkipInstall(e.target.checked)}
                        style={{
                          width: '16px',
                          height: '16px',
                          accentColor: 'var(--color-primary)',
                        }}
                      />
                      <span style={{ fontSize: '13px', color: '#ffffff' }}>Skip Install Deps</span>
                    </label>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '8px 4px',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={skipGitInit}
                        onChange={(e) => setSkipGitInit(e.target.checked)}
                        style={{
                          width: '16px',
                          height: '16px',
                          accentColor: 'var(--color-primary)',
                        }}
                      />
                      <span style={{ fontSize: '13px', color: '#ffffff' }}>Skip Git Init</span>
                    </label>
                  </div>

                  <div style={{ marginTop: '8px' }}>
                    <label style={labelStyle}>Install CocoaPods (iOS only)</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {(['auto', 'yes', 'no'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setRnInstallPods(opt === 'auto' ? null : opt === 'yes')}
                          style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '8px',
                            border: `1px solid ${(opt === 'auto' && rnInstallPods === null) || (opt === 'yes' && rnInstallPods === true) || (opt === 'no' && rnInstallPods === false) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            background:
                              (opt === 'auto' && rnInstallPods === null) ||
                              (opt === 'yes' && rnInstallPods === true) ||
                              (opt === 'no' && rnInstallPods === false)
                                ? 'rgba(0, 122, 255, 0.1)'
                                : 'transparent',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            color:
                              (opt === 'auto' && rnInstallPods === null) ||
                              (opt === 'yes' && rnInstallPods === true) ||
                              (opt === 'no' && rnInstallPods === false)
                                ? '#ffffff'
                                : 'var(--color-text-secondary)',
                          }}
                        >
                          {opt.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Expo Options */}
              {projectType === 'expo' && (
                <div style={sectionStyle}>
                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>📱</span> Expo Managed Options
                  </h3>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Select Template</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                      {EXPO_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.value}
                          type="button"
                          onClick={() => setExpoTemplate(tpl.value)}
                          style={{
                            padding: '12px',
                            borderRadius: '10px',
                            border: `1px solid ${expoTemplate === tpl.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            background:
                              expoTemplate === tpl.value ? 'rgba(0, 122, 255, 0.1)' : 'transparent',
                            textAlign: 'left',
                            cursor: 'pointer',
                            color:
                              expoTemplate === tpl.value
                                ? '#ffffff'
                                : 'var(--color-text-secondary)',
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{tpl.label}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            {tpl.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={labelStyle}>Expo SDK Version</label>
                      <select
                        value={expoVersion}
                        onChange={(e) => setExpoVersion(e.target.value)}
                        style={inputStyle}
                      >
                        <option value="">Latest</option>
                        {expoVersions.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Package Manager</label>
                      <select
                        value={expoPackageManager}
                        onChange={(e) => setExpoPackageManager(e.target.value as any)}
                        style={inputStyle}
                      >
                        <option value="npm">npm</option>
                        <option value="yarn">Yarn</option>
                        <option value="pnpm">pnpm</option>
                        <option value="bun">Bun</option>
                      </select>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        paddingTop: '24px',
                      }}
                    >
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={expoNoInstall}
                          onChange={(e) => setExpoNoInstall(e.target.checked)}
                          style={{
                            width: '16px',
                            height: '16px',
                            accentColor: 'var(--color-primary)',
                          }}
                        />
                        <span style={{ fontSize: '13px', color: '#ffffff' }}>No Install</span>
                      </label>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={expoNoGit}
                          onChange={(e) => setExpoNoGit(e.target.checked)}
                          style={{
                            width: '16px',
                            height: '16px',
                            accentColor: 'var(--color-primary)',
                          }}
                        />
                        <span style={{ fontSize: '13px', color: '#ffffff' }}>No Git</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Creation Progress */}
          {(isCreating || creationSuccess || creationError) && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: '400px',
              }}
            >
              <div
                style={{
                  padding: '40px 0',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                {isCreating ? (
                  <div className="spinner-large" style={{ color: 'var(--color-primary)' }} />
                ) : creationSuccess ? (
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'rgba(52, 199, 89, 0.1)',
                      color: '#34C759',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircleIcon size={40} />
                  </div>
                ) : (
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'rgba(255, 59, 48, 0.1)',
                      color: '#FF3B30',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AlertCircleIcon size={40} />
                  </div>
                )}
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                  {isCreating
                    ? 'Creating Project...'
                    : creationSuccess
                      ? 'Project Ready!'
                      : 'Creation Failed'}
                </h3>
                <p
                  style={{
                    color: 'var(--color-text-secondary)',
                    fontSize: '14px',
                    maxWidth: '400px',
                  }}
                >
                  {isCreating
                    ? 'Please wait while we initialize your project and install dependencies.'
                    : creationSuccess
                      ? 'Your project has been successfully initialized and added to your dashboard.'
                      : creationError}
                </p>
              </div>

              {/* Logs */}
              <div
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  fontFamily: 'monospace',
                  lineHeight: 1.6,
                }}
              >
                {creationLogs.map((log, index) => (
                  <div
                    key={index}
                    style={{ color: log.includes('ERROR') ? 'var(--color-error)' : '#aaa' }}
                  >
                    {log}
                  </div>
                ))}
                {creationError && (
                  <div style={{ color: 'var(--color-error)', marginTop: '8px' }}>
                    Error: {creationError}
                  </div>
                )}
              </div>

              {creationSuccess && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: 'rgba(52, 199, 89, 0.1)',
                    borderRadius: '10px',
                    border: '1px solid rgba(52, 199, 89, 0.2)',
                  }}
                >
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    Your project is ready at: <br />
                    <code
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'inline-block',
                        marginTop: '8px',
                      }}
                    >
                      {targetPath}/{projectName}
                    </code>
                  </p>
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-text-secondary)',
                      marginTop: '12px',
                    }}
                  >
                    Add this project to App Builder using "New Project" → Browse to the created
                    folder.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--spacing-sm)',
            padding: 'var(--spacing-md) var(--spacing-lg)',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-sidebar)',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isCreating}
            style={{ minWidth: '100px', opacity: isCreating ? 0.5 : 1 }}
          >
            {creationSuccess ? 'Close' : 'Cancel'}
          </button>
          {!creationSuccess && !creationError && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={!projectName || !targetPath || isCreating}
              style={{
                minWidth: '160px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center',
              }}
            >
              {isCreating ? (
                <>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  Creating...
                </>
              ) : (
                <>
                  <PlayIcon size={16} />
                  Create Project
                </>
              )}
            </button>
          )}
          {creationError && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={resetForm}
              style={{ minWidth: '120px' }}
            >
              Try Again
            </button>
          )}
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};
