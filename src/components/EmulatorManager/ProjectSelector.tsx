import React from 'react';
import { Project } from '../../types/project';

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProjectId,
  setSelectedProjectId,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '6px 6px 6px 16px',
        background: 'var(--color-sidebar)',
        borderRadius: '16px',
        border: '1px solid var(--color-border)',
      }}
    >
      <label
        style={{
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--color-text-secondary)',
          whiteSpace: 'nowrap',
        }}
      >
        Target Project:
      </label>
      <select
        value={selectedProjectId}
        onChange={(e) => setSelectedProjectId(e.target.value)}
        style={{
          minWidth: '200px',
          padding: '10px 14px',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          background: 'var(--color-card)',
          color: 'var(--color-text)',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.2s ease',
        }}
      >
        <option value="">-- Choose Application --</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      {!selectedProjectId && (
        <div
          style={{
            paddingRight: '10px',
            animation: 'pulse 2s infinite',
          }}
        >
          <span style={{ fontSize: '18px' }} title="Selection required to run apps">
            ⚠️
          </span>
        </div>
      )}
    </div>
  );
};
