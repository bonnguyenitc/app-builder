import React, { useState } from 'react';
import {
  AppleIcon,
  AndroidIcon,
  SettingsIcon,
  LoaderIcon,
  TrashIcon,
  ShieldIcon,
  EraserIcon,
  RocketIcon,
  CodeIcon,
  TerminalIcon,
  PlayIcon,
  PackageIcon,
} from './Icons';
import { Project } from '../types/project';
import { useBuildStore, buildKey } from '../stores/buildStore';

interface ProjectCardProps {
  project: Project;
  onBuild: (
    platform: 'ios' | 'android',
    options?: {
      uploadToAppStore?: boolean;
      releaseNote?: string;
      androidFormat?: 'apk' | 'aab';
      sendToAppDistribution?: boolean;
    },
  ) => void;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPermissions: () => void;
  onDeepClean: () => void;
  onOpenXcode: () => void;
  onOpenAndroidStudio: () => void;
  onStartMetro: () => void;
  onOpenVSCode: () => void;
  onOpenTerminal: () => void;
  onRunApp: (platform: 'ios' | 'android') => void;
  onDependencies: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onBuild,
  onSelect,
  onEdit,
  onDelete,
  onPermissions,
  onDeepClean,
  onOpenXcode,
  onOpenAndroidStudio,
  onStartMetro,
  onOpenVSCode,
  onOpenTerminal,
  onRunApp,
  onDependencies,
}) => {
  const [uploadToAppStore, setUploadToAppStore] = useState(() => {
    return localStorage.getItem(`upload_to_appstore_${project.id}`) === 'true';
  });

  const [releaseNote, setReleaseNote] = useState(() => {
    return localStorage.getItem(`release_note_${project.id}`) || '';
  });

  const [androidFormat, setAndroidFormat] = useState<'apk' | 'aab'>(() => {
    return (localStorage.getItem(`android_format_${project.id}`) as 'apk' | 'aab') || 'aab';
  });

  const [sendToAppDistribution, setSendToAppDistribution] = useState(() => {
    return localStorage.getItem(`send_to_app_distribution_${project.id}`) === 'true';
  });

  const [isHovered, setIsHovered] = useState(false);

  // Per-platform building state
  const iosBuild = useBuildStore((s) => s.activeBuilds[buildKey(project.id, 'ios')]);
  const androidBuild = useBuildStore((s) => s.activeBuilds[buildKey(project.id, 'android')]);
  const isBuildingIos = iosBuild?.status === 'building';
  const isBuildingAndroid = androidBuild?.status === 'building';

  const handleAndroidFormatChange = (format: 'apk' | 'aab') => {
    setAndroidFormat(format);
    localStorage.setItem(`android_format_${project.id}`, format);
  };

  const handleSendToAppDistributionChange = (checked: boolean) => {
    setSendToAppDistribution(checked);
    localStorage.setItem(`send_to_app_distribution_${project.id}`, String(checked));
  };

  const handleUploadChange = (checked: boolean) => {
    setUploadToAppStore(checked);
    localStorage.setItem(`upload_to_appstore_${project.id}`, String(checked));
  };

  const handleReleaseNoteChange = (value: string) => {
    setReleaseNote(value);
    localStorage.setItem(`release_note_${project.id}`, value);
  };

  const hasIosCredentials = !!project.ios.config?.apiKey && !!project.ios.config?.apiIssuer;
  const hasReleaseNote = !!releaseNote.trim();
  const canBuildIos = hasReleaseNote && !isBuildingIos;
  const canBuildAndroid = hasReleaseNote && !isBuildingAndroid;

  return (
    <div
      className="card card-interactive"
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        cursor: 'pointer',
        position: 'relative',
        background: isHovered
          ? 'linear-gradient(135deg, var(--glass-bg-strong) 0%, rgba(0, 122, 255, 0.03) 100%)'
          : 'var(--glass-bg-strong)',
      }}
    >
      {/* Gradient border effect on hover */}
      <div
        style={{
          position: 'absolute',
          top: -1,
          left: -1,
          right: -1,
          bottom: -1,
          borderRadius: 'var(--radius-lg)',
          background: isHovered
            ? 'linear-gradient(135deg, rgba(0, 122, 255, 0.3), rgba(88, 86, 214, 0.3))'
            : 'transparent',
          zIndex: -1,
          transition: 'all var(--transition-normal)',
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 'var(--spacing-md)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            flex: 1,
            minWidth: 0,
            marginRight: 'var(--spacing-sm)',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)',
              color: 'white',
              fontSize: '16px',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {project.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={project.name}
            >
              {project.name}
            </h3>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: '12px',
                fontFamily:
                  "'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace",
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={project.ios.bundleId || project.android.bundleId}
            >
              {project.ios.bundleId || project.android.bundleId}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexShrink: 0 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="btn btn-ghost"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <SettingsIcon size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="btn btn-ghost"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-error)',
            }}
          >
            <TrashIcon size={14} />
          </button>
        </div>
      </div>

      {/* Version Info */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-md)',
          padding: 'var(--spacing-md)',
          background: 'var(--color-sidebar)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            fontSize: '13px',
          }}
        >
          <div className="icon-container icon-container-primary" style={{ padding: '4px' }}>
            <AppleIcon size={14} />
          </div>
          <span style={{ flex: 1, fontWeight: 500 }}>iOS</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="badge badge-primary" style={{ fontSize: '11px', padding: '2px 8px' }}>
              {project.ios.version} ({project.ios.buildNumber})
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRunApp('ios');
              }}
              className="btn btn-ghost"
              title="Run on Simulator"
              style={{ padding: '2px', borderRadius: '4px', color: 'var(--color-primary)' }}
            >
              <PlayIcon size={12} fill="currentColor" />
            </button>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            fontSize: '13px',
          }}
        >
          <div className="icon-container icon-container-success" style={{ padding: '4px' }}>
            <AndroidIcon size={14} />
          </div>
          <span style={{ flex: 1, fontWeight: 500 }}>Android</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="badge badge-success" style={{ fontSize: '11px', padding: '2px 8px' }}>
              {project.android.version} ({project.android.versionCode})
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRunApp('android');
              }}
              className="btn btn-ghost"
              title="Run on Emulator"
              style={{ padding: '2px', borderRadius: '4px', color: 'var(--color-success)' }}
            >
              <PlayIcon size={12} fill="currentColor" />
            </button>
          </div>
        </div>
      </div>

      {/* Release Note Input */}
      <div style={{ marginBottom: 'var(--spacing-md)' }} onClick={(e) => e.stopPropagation()}>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            marginBottom: '6px',
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
          }}
        >
          Release Note <span style={{ color: 'var(--color-error)' }}>*</span>
        </label>
        <textarea
          value={releaseNote}
          onChange={(e) => handleReleaseNoteChange(e.target.value)}
          placeholder="Enter release notes for this build..."
          className="input"
          style={{
            minHeight: '70px',
            resize: 'vertical',
            fontFamily: 'inherit',
            fontSize: '13px',
            lineHeight: 1.5,
          }}
        />
      </div>

      {/* Upload Checkboxes Row */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-md)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Upload to App Store (iOS) */}
        <label
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            fontSize: '13px',
            cursor: hasIosCredentials ? 'pointer' : 'not-allowed',
            userSelect: 'none',
            color: hasIosCredentials ? 'var(--color-text)' : 'var(--color-text-secondary)',
            padding: 'var(--spacing-sm)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <input
            type="checkbox"
            checked={uploadToAppStore}
            onChange={(e) => handleUploadChange(e.target.checked)}
            disabled={!hasIosCredentials}
            style={{
              cursor: hasIosCredentials ? 'pointer' : 'not-allowed',
              width: '16px',
              height: '16px',
              accentColor: 'var(--color-primary)',
            }}
          />
          <span style={{ fontWeight: 500 }}>
            App Store{' '}
            {!hasIosCredentials && (
              <span style={{ fontSize: '10px', opacity: 0.7 }}>(No credentials)</span>
            )}
          </span>
        </label>

        {/* Send to App Distribution (Android) */}
        <label
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            fontSize: '13px',
            cursor: 'pointer',
            userSelect: 'none',
            color: 'var(--color-text)',
            padding: 'var(--spacing-sm)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <input
            type="checkbox"
            checked={sendToAppDistribution}
            onChange={(e) => handleSendToAppDistributionChange(e.target.checked)}
            style={{
              cursor: 'pointer',
              width: '16px',
              height: '16px',
              accentColor: 'var(--color-success)',
            }}
          />
          <span style={{ fontWeight: 500 }}>App Distribution</span>
        </label>
      </div>

      {/* Build Buttons */}
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
        <button
          className="btn"
          onClick={(e) => {
            e.stopPropagation();
            if (canBuildIos) {
              onBuild('ios', { uploadToAppStore, releaseNote: releaseNote.trim() });
            }
          }}
          disabled={!canBuildIos}
          style={{
            flex: 1,
            padding: '10px var(--spacing-sm)',
            fontSize: '13px',
            fontWeight: 600,
            background: canBuildIos ? 'var(--gradient-primary)' : 'var(--color-border)',
            color: canBuildIos ? 'white' : 'var(--color-text-secondary)',
            opacity: !canBuildIos ? 0.6 : 1,
            cursor: !canBuildIos ? 'not-allowed' : 'pointer',
            boxShadow: canBuildIos ? '0 4px 14px rgba(0, 122, 255, 0.3)' : 'none',
          }}
        >
          {isBuildingIos ? (
            <>
              <LoaderIcon size={14} className="animate-spin" />
              <span>Building...</span>
            </>
          ) : (
            <>
              <AppleIcon size={14} />
              <span>Build iOS</span>
            </>
          )}
        </button>
        <button
          className="btn"
          onClick={(e) => {
            e.stopPropagation();
            if (canBuildAndroid) {
              onBuild('android', {
                releaseNote: releaseNote.trim(),
                androidFormat,
                sendToAppDistribution,
              });
            }
          }}
          disabled={!canBuildAndroid}
          style={{
            flex: 1,
            padding: '10px var(--spacing-sm)',
            fontSize: '13px',
            fontWeight: 600,
            background: canBuildAndroid ? 'var(--gradient-success)' : 'var(--color-border)',
            color: canBuildAndroid ? 'white' : 'var(--color-text-secondary)',
            opacity: !canBuildAndroid ? 0.6 : 1,
            cursor: !canBuildAndroid ? 'not-allowed' : 'pointer',
            boxShadow: canBuildAndroid ? '0 4px 14px rgba(52, 199, 89, 0.3)' : 'none',
          }}
        >
          {isBuildingAndroid ? (
            <>
              <LoaderIcon size={14} className="animate-spin" />
              <span>Building...</span>
            </>
          ) : (
            <>
              <AndroidIcon size={14} />
              <span>Build Android</span>
            </>
          )}
        </button>
      </div>

      {/* Android Format Selector */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          marginTop: '10px',
          gap: '8px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          Output:
        </span>
        <div
          style={{
            display: 'flex',
            background: 'rgba(0,0,0,0.2)',
            padding: '2px',
            borderRadius: '6px',
            border: '1px solid var(--color-border)',
          }}
        >
          <button
            onClick={() => handleAndroidFormatChange('aab')}
            style={{
              padding: '3px 10px',
              fontSize: '10px',
              fontWeight: 700,
              borderRadius: '4px',
              background: androidFormat === 'aab' ? 'var(--color-success)' : 'transparent',
              color: androidFormat === 'aab' ? 'white' : 'var(--color-text-secondary)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            AAB
          </button>
          <button
            onClick={() => handleAndroidFormatChange('apk')}
            style={{
              padding: '3px 10px',
              fontSize: '10px',
              fontWeight: 700,
              borderRadius: '4px',
              background: androidFormat === 'apk' ? 'var(--color-success)' : 'transparent',
              color: androidFormat === 'apk' ? 'white' : 'var(--color-text-secondary)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            APK
          </button>
        </div>
      </div>

      {/* Utility Actions — icon grid with tooltips, large touch targets */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '6px',
          marginTop: 'var(--spacing-md)',
        }}
      >
        {[
          {
            icon: <ShieldIcon size={14} />,
            label: 'Permissions',
            onClick: onPermissions,
            color: 'var(--color-text-secondary)',
          },
          {
            icon: <EraserIcon size={14} />,
            label: 'Deep Clean',
            onClick: onDeepClean,
            color: 'var(--color-text-secondary)',
          },
          {
            icon: <AppleIcon size={14} />,
            label: 'Open Xcode',
            onClick: onOpenXcode,
            color: 'var(--color-text-secondary)',
          },
          {
            icon: <AndroidIcon size={14} />,
            label: 'Android Studio',
            onClick: onOpenAndroidStudio,
            color: 'var(--color-success)',
          },
          {
            icon: <CodeIcon size={14} />,
            label: 'VS Code',
            onClick: onOpenVSCode,
            color: 'var(--color-text-secondary)',
          },
          {
            icon: <RocketIcon size={14} />,
            label: 'Start Metro',
            onClick: onStartMetro,
            color: 'var(--color-primary)',
          },
          {
            icon: <TerminalIcon size={14} />,
            label: 'Terminal',
            onClick: onOpenTerminal,
            color: 'var(--color-text-secondary)',
          },
          {
            icon: <PackageIcon size={14} />,
            label: 'Packages',
            onClick: onDependencies,
            color: 'var(--color-text-secondary)',
          },
        ].map(({ icon, label, onClick, color }) => (
          <button
            key={label}
            title={label}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="btn btn-ghost"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '36px',
              padding: 0,
              borderRadius: 'var(--radius-sm)',
              color,
              background: 'var(--color-sidebar)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Last Build Status */}
      {project.lastBuild && (
        <div
          style={{
            marginTop: 'var(--spacing-md)',
            paddingTop: 'var(--spacing-md)',
            borderTop: '1px solid var(--color-border)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
          }}
        >
          <span
            className={`status-dot ${
              project.lastBuild.status === 'success'
                ? 'success'
                : project.lastBuild.status === 'failed'
                  ? 'error'
                  : 'warning'
            }`}
          />
          <span style={{ color: 'var(--color-text-secondary)' }}>
            Last build{' '}
            <span
              style={{
                fontWeight: 600,
                color:
                  project.lastBuild.status === 'success'
                    ? 'var(--color-success)'
                    : project.lastBuild.status === 'failed'
                      ? 'var(--color-error)'
                      : 'var(--color-warning)',
              }}
            >
              {project.lastBuild.status}
            </span>{' '}
            • {new Date(project.lastBuild.timestamp).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );
};
