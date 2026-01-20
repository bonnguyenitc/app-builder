import React, { useState, useEffect } from 'react';
import { Shield, Key, Trash2, CheckCircle2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

export const Settings: React.FC = () => {
  const [appStoreKey, setAppStoreKey] = useState('');
  const [googlePlayKey, setGooglePlayKey] = useState('');
  const [isIosSaved, setIsIosSaved] = useState(false);
  const [isAndroidSaved, setIsAndroidSaved] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    checkCredentials();
  }, []);

  const checkCredentials = async () => {
    // We check if they exist by trying to get them (logic can be refined to just 'exists')
    try {
      await invoke('get_credential', {
        service: 'rn-release-manager',
        account: 'app-store-connect',
      });
      setIsIosSaved(true);
    } catch (e) {
      setIsIosSaved(false);
    }

    try {
      await invoke('get_credential', { service: 'rn-release-manager', account: 'google-play' });
      setIsAndroidSaved(true);
    } catch (e) {
      setIsAndroidSaved(false);
    }
  };

  const handleSaveIos = async () => {
    try {
      await invoke('save_credential', {
        service: 'rn-release-manager',
        account: 'app-store-connect',
        password: appStoreKey,
      });
      setIsIosSaved(true);
      setAppStoreKey('');
      setStatus({ type: 'success', message: 'App Store Connect key saved to Keychain' });
    } catch (e) {
      setStatus({ type: 'error', message: `Failed to save: ${e}` });
    }
  };

  const handleSaveAndroid = async () => {
    try {
      await invoke('save_credential', {
        service: 'rn-release-manager',
        account: 'google-play',
        password: googlePlayKey,
      });
      setIsAndroidSaved(true);
      setGooglePlayKey('');
      setStatus({ type: 'success', message: 'Google Play key saved to Keychain' });
    } catch (e) {
      setStatus({ type: 'error', message: `Failed to save: ${e}` });
    }
  };

  const handleDelete = async (account: string) => {
    try {
      await invoke('delete_credential', { service: 'rn-release-manager', account });
      if (account === 'app-store-connect') setIsIosSaved(false);
      else setIsAndroidSaved(false);
      setStatus({ type: 'success', message: 'Credential removed from Keychain' });
    } catch (e) {
      setStatus({ type: 'error', message: `Failed to delete: ${e}` });
    }
  };

  return (
    <div className="settings-page" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Settings</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Global configuration and secure credentials
        </p>
      </div>

      {status && (
        <div
          style={{
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            backgroundColor:
              status.type === 'success' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
            color: status.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
            marginBottom: 'var(--spacing-lg)',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
          }}
        >
          {status.type === 'success' ? <CheckCircle2 size={16} /> : <Shield size={16} />}
          {status.message}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
        {/* App Store Connect Section */}
        <section className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              marginBottom: 'var(--spacing-lg)',
            }}
          >
            <div
              style={{
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                color: 'var(--color-primary)',
              }}
            >
              <Key size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 600 }}>App Store Connect</h2>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                API Key for TestFlight and App Store uploads
              </p>
            </div>
          </div>

          {isIosSaved ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--spacing-md)',
                backgroundColor: 'var(--color-sidebar)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  color: 'var(--color-success)',
                }}
              >
                <CheckCircle2 size={18} />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  Credential secured in Keychain
                </span>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => handleDelete('app-store-connect')}
                style={{ color: 'var(--color-error)' }}
              >
                <Trash2 size={16} />
                <span>Remove</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <p style={{ fontSize: '13px' }}>
                Paste your App Store Connect API Key (JSON format or Base64 key content):
              </p>
              <textarea
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  height: '100px',
                  textAlign: 'left',
                  cursor: 'text',
                  fontFamily: 'monospace',
                  padding: 'var(--spacing-md)',
                }}
                value={appStoreKey}
                onChange={(e) => setAppStoreKey(e.target.value)}
                placeholder='{ "key_id": "...", "issuer_id": "...", "key": "..." }'
              />
              <button className="btn btn-primary" onClick={handleSaveIos} disabled={!appStoreKey}>
                Save to Keychain
              </button>
            </div>
          )}
        </section>

        {/* Google Play Section */}
        <section className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              marginBottom: 'var(--spacing-lg)',
            }}
          >
            <div
              style={{
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(52, 199, 89, 0.1)',
                color: 'var(--color-success)',
              }}
            >
              <Key size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 600 }}>Google Play Console</h2>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Service Account JSON for Play Store releases
              </p>
            </div>
          </div>

          {isAndroidSaved ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--spacing-md)',
                backgroundColor: 'var(--color-sidebar)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  color: 'var(--color-success)',
                }}
              >
                <CheckCircle2 size={18} />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  Credential secured in Keychain
                </span>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => handleDelete('google-play')}
                style={{ color: 'var(--color-error)' }}
              >
                <Trash2 size={16} />
                <span>Remove</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <p style={{ fontSize: '13px' }}>Paste your Google Play Service Account JSON:</p>
              <textarea
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  height: '100px',
                  textAlign: 'left',
                  cursor: 'text',
                  fontFamily: 'monospace',
                  padding: 'var(--spacing-md)',
                }}
                value={googlePlayKey}
                onChange={(e) => setGooglePlayKey(e.target.value)}
                placeholder='{ "type": "service_account", ... }'
              />
              <button
                className="btn btn-primary"
                onClick={handleSaveAndroid}
                disabled={!googlePlayKey}
              >
                Save to Keychain
              </button>
            </div>
          )}
        </section>

        {/* Info Section */}
        <section
          style={{
            display: 'flex',
            gap: 'var(--spacing-md)',
            padding: 'var(--spacing-md)',
            backgroundColor: 'rgba(0, 122, 255, 0.05)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(0, 122, 255, 0.1)',
          }}
        >
          <Shield size={20} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
              Secure Storage
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
              Your credentials are saved directly into the macOS Keychain. This app does not upload
              them to any server. They are only used locally to authenticate with App Store Connect
              and Google Play when you trigger a release.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
