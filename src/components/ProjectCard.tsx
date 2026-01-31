import React, { useState } from 'react';
import {
  AppleIcon,
  AndroidIcon,
  SettingsIcon,
  LoaderIcon,
  TrashIcon,
  ShieldIcon,
  EraserIcon,
} from './Icons';
import { Project } from '../types/project';

interface ProjectCardProps {
  project: Project;
  onBuild: (
    platform: 'ios' | 'android',
    options?: { uploadToAppStore?: boolean; releaseNote?: string },
  ) => void;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPermissions: () => void;
  onDeepClean: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onBuild,
  onSelect,
  onEdit,
  onDelete,
  onPermissions,
  onDeepClean,
}) => {
  const [uploadToAppStore, setUploadToAppStore] = useState(() => {
    return localStorage.getItem(`upload_to_appstore_${project.id}`) === 'true';
  });

  const [releaseNote, setReleaseNote] = useState(() => {
    return localStorage.getItem(`release_note_${project.id}`) || '';
  });

  const [isHovered, setIsHovered] = useState(false);

  const handleUploadChange = (checked: boolean) => {
    setUploadToAppStore(checked);
    localStorage.setItem(`upload_to_appstore_${project.id}`, String(checked));
  };

  const handleReleaseNoteChange = (value: string) => {
    setReleaseNote(value);
    localStorage.setItem(`release_note_${project.id}`, value);
  };

  const hasIosCredentials = !!project.ios.config?.apiKey && !!project.ios.config?.apiIssuer;
  const isBuilding = project.lastBuild?.status === 'building';
  const canBuild = releaseNote.trim() && !isBuilding;

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
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
            }}
          >
            {project.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '2px' }}>
              {project.name}
            </h3>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: '12px',
                fontFamily:
                  "'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace",
              }}
            >
              {project.ios.bundleId || project.android.bundleId}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPermissions();
            }}
            className="btn btn-ghost"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
            }}
            title="Manage Permissions"
          >
            <ShieldIcon size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeepClean();
            }}
            className="btn btn-ghost"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
            }}
            title="Deep Clean (Fix Everything)"
          >
            <EraserIcon size={14} />
          </button>
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
          <span className="badge badge-primary" style={{ fontSize: '11px', padding: '2px 8px' }}>
            {project.ios.version} ({project.ios.buildNumber})
          </span>
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
          <span className="badge badge-success" style={{ fontSize: '11px', padding: '2px 8px' }}>
            {project.android.version} ({project.android.versionCode})
          </span>
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

      {/* Upload Checkbox */}
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            fontSize: '13px',
            cursor: hasIosCredentials ? 'pointer' : 'not-allowed',
            userSelect: 'none',
            color: hasIosCredentials ? 'var(--color-text)' : 'var(--color-text-secondary)',
            padding: 'var(--spacing-sm)',
            borderRadius: 'var(--radius-sm)',
            transition: 'background-color var(--transition-fast)',
          }}
          onClick={(e) => e.stopPropagation()}
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
            Upload to App Store{' '}
            {!hasIosCredentials && (
              <span style={{ fontSize: '11px', opacity: 0.7 }}>
                (Configure API credentials first)
              </span>
            )}
          </span>
        </label>
      </div>

      {/* Build Buttons */}
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
        <button
          className="btn"
          onClick={(e) => {
            e.stopPropagation();
            if (canBuild) {
              onBuild('ios', { uploadToAppStore, releaseNote: releaseNote.trim() });
            }
          }}
          disabled={!canBuild}
          style={{
            flex: 1,
            padding: '10px var(--spacing-sm)',
            fontSize: '13px',
            fontWeight: 600,
            background: canBuild ? 'var(--gradient-primary)' : 'var(--color-border)',
            color: canBuild ? 'white' : 'var(--color-text-secondary)',
            opacity: !canBuild ? 0.6 : 1,
            cursor: !canBuild ? 'not-allowed' : 'pointer',
            boxShadow: canBuild ? '0 4px 14px rgba(0, 122, 255, 0.3)' : 'none',
          }}
        >
          {isBuilding && project.lastBuild?.platform === 'ios' ? (
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
            if (canBuild) {
              onBuild('android', { releaseNote: releaseNote.trim() });
            }
          }}
          disabled={!canBuild}
          style={{
            flex: 1,
            padding: '10px var(--spacing-sm)',
            fontSize: '13px',
            fontWeight: 600,
            background: canBuild ? 'var(--gradient-success)' : 'var(--color-border)',
            color: canBuild ? 'white' : 'var(--color-text-secondary)',
            opacity: !canBuild ? 0.6 : 1,
            cursor: !canBuild ? 'not-allowed' : 'pointer',
            boxShadow: canBuild ? '0 4px 14px rgba(52, 199, 89, 0.3)' : 'none',
          }}
        >
          {isBuilding && project.lastBuild?.platform === 'android' ? (
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
