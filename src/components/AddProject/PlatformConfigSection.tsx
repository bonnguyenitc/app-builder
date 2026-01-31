import React from 'react';
import { inputStyle, labelStyle, sectionStyle } from './AddProject.styles';

interface PlatformConfigSectionProps {
  title: string;
  icon: React.ReactNode;
  iconContainerClass: string;
  bundleIdLabel: string;
  bundleId: string;
  setBundleId: (val: string) => void;
  version: string;
  setVersion: (val: string) => void;
  buildNumber: number;
  setBuildNumber: (val: number) => void;
  buildNumberLabel: string;
}

export const PlatformConfigSection: React.FC<PlatformConfigSectionProps> = ({
  title,
  icon,
  iconContainerClass,
  bundleIdLabel,
  bundleId,
  setBundleId,
  version,
  setVersion,
  buildNumber,
  setBuildNumber,
  buildNumberLabel,
}) => {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-md)',
        }}
      >
        <div className={`icon-container ${iconContainerClass}`} style={{ padding: '4px' }}>
          {icon}
        </div>
        <h3 style={{ fontSize: '14px', fontWeight: 600 }}>{title}</h3>
      </div>

      <div style={sectionStyle}>
        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
          <label style={labelStyle}>{bundleIdLabel}</label>
          <input
            style={inputStyle}
            value={bundleId}
            onChange={(e) => setBundleId(e.target.value)}
            placeholder="com.example.app"
          />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--spacing-sm)',
          }}
        >
          <div>
            <label style={labelStyle}>Version</label>
            <input
              style={inputStyle}
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0.0"
            />
          </div>
          <div>
            <label style={labelStyle}>{buildNumberLabel}</label>
            <input
              type="number"
              style={inputStyle}
              value={buildNumber}
              onChange={(e) => setBuildNumber(parseInt(e.target.value) || 0)}
              placeholder="1"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
