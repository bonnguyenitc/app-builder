import React from 'react';
import { SparklesIcon, FolderIcon } from '../Icons';
import { inputStyle, labelStyle, sectionStyle } from './AddProject.styles';

interface GeneralInfoSectionProps {
  name: string;
  setName: (name: string) => void;
  path: string;
  setPath: (path: string) => void;
  onBrowse: () => void;
}

export const GeneralInfoSection: React.FC<GeneralInfoSectionProps> = ({
  name,
  setName,
  path,
  setPath,
  onBrowse,
}) => {
  return (
    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-md)',
        }}
      >
        <SparklesIcon size={16} style={{ color: 'var(--color-primary)' }} />
        <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Basic Information</h3>
      </div>

      <div style={sectionStyle}>
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <label style={labelStyle}>Project Name</label>
          <input
            style={inputStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. My Awesome App"
            required
          />
        </div>

        <div>
          <label style={labelStyle}>Project Root Path</label>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <input
              style={{
                ...inputStyle,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/Users/me/projects/my-app"
              required
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onBrowse}
              style={{ flexShrink: 0, gap: '6px' }}
            >
              <FolderIcon size={16} />
              <span>Browse</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
