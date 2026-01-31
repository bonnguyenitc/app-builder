import React from 'react';
import { SettingsIcon, KeyIcon } from '../Icons';
import { inputStyle, labelStyle, sectionStyle } from './AddProject.styles';
import { Credential } from '../../types/credential';

interface IosBuildSettingsProps {
  scheme: string;
  setScheme: (val: string) => void;
  configuration: string;
  setConfiguration: (val: string) => void;
  exportMethod: 'development' | 'ad-hoc' | 'app-store' | 'enterprise';
  setExportMethod: (val: any) => void;
  selectedCredentialId: string;
  setSelectedCredentialId: (val: string) => void;
  credentials: Credential[];
}

export const IosBuildSettings: React.FC<IosBuildSettingsProps> = ({
  scheme,
  setScheme,
  configuration,
  setConfiguration,
  exportMethod,
  setExportMethod,
  selectedCredentialId,
  setSelectedCredentialId,
  credentials,
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
        <SettingsIcon size={16} style={{ color: 'var(--color-primary)' }} />
        <h3 style={{ fontSize: '14px', fontWeight: 600 }}>iOS Build Configuration</h3>
      </div>

      <div style={sectionStyle}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          <div>
            <label style={labelStyle}>Scheme</label>
            <input
              style={inputStyle}
              value={scheme}
              onChange={(e) => setScheme(e.target.value)}
              placeholder="MyApp"
            />
          </div>
          <div>
            <label style={labelStyle}>Configuration</label>
            <input
              style={inputStyle}
              value={configuration}
              onChange={(e) => setConfiguration(e.target.value)}
              placeholder="Release"
            />
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--spacing-md)',
          }}
        >
          <div>
            <label style={labelStyle}>Export Method</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={exportMethod}
              onChange={(e) => setExportMethod(e.target.value as any)}
            >
              <option value="development">Development</option>
              <option value="ad-hoc">Ad-Hoc</option>
              <option value="app-store">App Store</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>
              Credential
              <span
                style={{
                  color: 'var(--color-text-secondary)',
                  fontWeight: 400,
                  marginLeft: '4px',
                  fontSize: '12px',
                }}
              >
                (optional)
              </span>
            </label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={selectedCredentialId}
              onChange={(e) => setSelectedCredentialId(e.target.value)}
            >
              <option value="">None</option>
              {credentials.map((cred) => (
                <option key={cred.id} value={cred.id}>
                  {cred.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {credentials.length === 0 && (
          <p
            style={{
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              marginTop: 'var(--spacing-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 12px',
              background: 'rgba(0, 122, 255, 0.05)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <KeyIcon size={12} />
            No iOS credentials. Add one in Settings to enable App Store uploads.
          </p>
        )}
      </div>
    </div>
  );
};
