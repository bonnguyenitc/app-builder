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
      className="card"
      style={{ marginBottom: 'var(--spacing-xl)', padding: 'var(--spacing-lg)' }}
    >
      <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
        Select Project to Run
      </label>
      <select
        value={selectedProjectId}
        onChange={(e) => setSelectedProjectId(e.target.value)}
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '10px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
        }}
      >
        <option value="">-- Select Project --</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      {!selectedProjectId && (
        <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-warning)' }}>
          * Select a project to enable "Run App" button
        </p>
      )}
    </div>
  );
};
