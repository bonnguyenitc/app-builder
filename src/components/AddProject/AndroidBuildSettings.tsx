import React from 'react';
import { KeyIcon } from '../Icons';
import { inputStyle, labelStyle, sectionStyle } from './AddProject.styles';
import { Credential } from '../../types/credential';

interface AndroidBuildSettingsProps {
  selectedCredentialId: string;
  setSelectedCredentialId: (val: string) => void;
  buildCommand: string;
  setBuildCommand: (val: string) => void;
  credentials: Credential[];
  firebaseAppId: string;
  setFirebaseAppId: (val: string) => void;
  distributionGroups: string;
  setDistributionGroups: (val: string) => void;
}

export const AndroidBuildSettings: React.FC<AndroidBuildSettingsProps> = ({
  selectedCredentialId,
  setSelectedCredentialId,
  buildCommand,
  setBuildCommand,
  credentials,
  firebaseAppId,
  setFirebaseAppId,
  distributionGroups,
  setDistributionGroups,
}) => {
  return (
    <div style={{ marginBottom: 'var(--spacing-md)' }}>
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

        <div>
          <label style={labelStyle}>
            Custom Build Command
            <span
              style={{
                color: 'var(--color-text-secondary)',
                fontWeight: 400,
                marginLeft: '4px',
                fontSize: '12px',
              }}
            >
              (optional, e.g. ./gradlew assembleRelease)
            </span>
          </label>
          <input
            type="text"
            style={inputStyle}
            placeholder="./gradlew bundleRelease"
            value={buildCommand}
            onChange={(e) => setBuildCommand(e.target.value)}
          />
        </div>

        {/* Firebase App Distribution Section */}
        <div
          style={{
            marginTop: 'var(--spacing-md)',
            paddingTop: 'var(--spacing-md)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <p
            style={{
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: 'var(--spacing-sm)',
              color: 'var(--color-text)',
            }}
          >
            🔥 Firebase App Distribution
          </p>

          <div style={{ marginBottom: 'var(--spacing-sm)' }}>
            <label style={labelStyle}>
              Firebase App ID
              <span
                style={{
                  color: 'var(--color-text-secondary)',
                  fontWeight: 400,
                  marginLeft: '4px',
                  fontSize: '12px',
                }}
              >
                (e.g., 1:1234567890:android:0a1b2c3d4e5f)
              </span>
            </label>
            <input
              type="text"
              style={inputStyle}
              placeholder="1:1234567890:android:0a1b2c3d4e5f67890"
              value={firebaseAppId}
              onChange={(e) => setFirebaseAppId(e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>
              Distribution Groups
              <span
                style={{
                  color: 'var(--color-text-secondary)',
                  fontWeight: 400,
                  marginLeft: '4px',
                  fontSize: '12px',
                }}
              >
                (comma-separated, e.g., qa-team, testers)
              </span>
            </label>
            <input
              type="text"
              style={inputStyle}
              placeholder="qa-team, trusted-testers"
              value={distributionGroups}
              onChange={(e) => setDistributionGroups(e.target.value)}
            />
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
