import React from 'react';
import { SettingsIcon, KeyIcon } from '../Icons';
import { inputStyle, labelStyle, sectionStyle } from './AddProject.styles';
import { Credential } from '../../types/credential';

interface AndroidBuildSettingsProps {
  selectedCredentialId: string;
  setSelectedCredentialId: (val: string) => void;
  credentials: Credential[];
}

export const AndroidBuildSettings: React.FC<AndroidBuildSettingsProps> = ({
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
        <SettingsIcon size={16} style={{ color: 'var(--color-success)' }} />
        <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Android Build Configuration</h3>
      </div>

      <div style={sectionStyle}>
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
                {cred.android?.serviceAccountEmail && ` (${cred.android.serviceAccountEmail})`}
              </option>
            ))}
          </select>
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
              background: 'rgba(52, 199, 89, 0.05)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <KeyIcon size={12} />
            No Android credentials. Add one in Settings to enable Play Store uploads.
          </p>
        )}
      </div>
    </div>
  );
};
