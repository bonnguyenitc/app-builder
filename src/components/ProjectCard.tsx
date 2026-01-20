import React from 'react';
import { Apple, Smartphone, Play, Settings, Loader } from 'lucide-react';
import { Project } from '../types/project';

interface ProjectCardProps {
  project: Project;
  onBuild: (platform: 'ios' | 'android') => void;
  onSelect: () => void;
  onEdit: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onBuild, onSelect, onEdit }) => {
  return (
    <div className="card" onClick={onSelect} style={{ cursor: 'pointer' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 'var(--spacing-md)',
        }}
      >
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '2px' }}>{project.name}</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
            {project.bundleId.ios || project.bundleId.android}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-text-secondary)',
            }}
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-md)',
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
          <Apple size={14} style={{ color: 'var(--color-text-secondary)' }} />
          <span style={{ flex: 1 }}>iOS</span>
          <span style={{ fontWeight: 500 }}>
            {project.version.ios} ({project.buildNumber.ios})
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
          <Smartphone size={14} style={{ color: 'var(--color-text-secondary)' }} />
          <span style={{ flex: 1 }}>Android</span>
          <span style={{ fontWeight: 500 }}>
            {project.version.android} ({project.buildNumber.android})
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
        <button
          className="btn btn-primary"
          onClick={(e) => {
            e.stopPropagation();
            onBuild('ios');
          }}
          disabled={project.lastBuild?.status === 'building'}
          style={{
            flex: 1,
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            fontSize: '12px',
            opacity: project.lastBuild?.status === 'building' ? 0.7 : 1,
            cursor: project.lastBuild?.status === 'building' ? 'not-allowed' : 'pointer',
          }}
        >
          {project.lastBuild?.status === 'building' && project.lastBuild.platform === 'ios' ? (
            <>
              <Loader size={12} className="animate-spin" />
              <span>Building...</span>
            </>
          ) : (
            <>
              <Play size={12} fill="currentColor" />
              <span>Build iOS</span>
            </>
          )}
        </button>
        <button
          className="btn btn-secondary"
          onClick={(e) => {
            e.stopPropagation();
            onBuild('android');
          }}
          disabled={project.lastBuild?.status === 'building'}
          style={{
            flex: 1,
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            fontSize: '12px',
            opacity: project.lastBuild?.status === 'building' ? 0.7 : 1,
            cursor: project.lastBuild?.status === 'building' ? 'not-allowed' : 'pointer',
          }}
        >
          {project.lastBuild?.status === 'building' && project.lastBuild.platform === 'android' ? (
            <>
              <Loader size={12} className="animate-spin" />
              <span>Building...</span>
            </>
          ) : (
            <>
              <Play size={12} fill="currentColor" />
              <span>Build Android</span>
            </>
          )}
        </button>
      </div>

      {project.lastBuild && (
        <div
          style={{
            marginTop: 'var(--spacing-md)',
            paddingTop: 'var(--spacing-md)',
            borderTop: '1px solid var(--color-border)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor:
                project.lastBuild.status === 'success'
                  ? 'var(--color-success)'
                  : project.lastBuild.status === 'failed'
                    ? 'var(--color-error)'
                    : 'var(--color-warning)',
            }}
          />
          <span style={{ color: 'var(--color-text-secondary)' }}>
            Last build {project.lastBuild.status}:{' '}
            {new Date(project.lastBuild.timestamp).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );
};
