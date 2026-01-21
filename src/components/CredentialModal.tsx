import React, { useState, useEffect } from 'react';
import { X, Key, Shield } from 'lucide-react';
import { Credential } from '../types/credential';

interface CredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    credential: Credential,
    apiKeyContent?: string,
    serviceAccountJson?: string,
  ) => Promise<void>;
  editingCredential?: Credential | null;
}

export const CredentialModal: React.FC<CredentialModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCredential,
}) => {
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');

  // iOS fields
  const [teamId, setTeamId] = useState('');
  const [apiKeyId, setApiKeyId] = useState('');
  const [apiIssuerId, setApiIssuerId] = useState('');
  const [apiKeyContent, setApiKeyContent] = useState('');

  // Android fields
  const [serviceAccountEmail, setServiceAccountEmail] = useState('');
  const [serviceAccountJson, setServiceAccountJson] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingCredential) {
      setName(editingCredential.name);
      setPlatform(editingCredential.platform);

      if (editingCredential.platform === 'ios' && editingCredential.ios) {
        setTeamId(editingCredential.ios.teamId);
        setApiKeyId(editingCredential.ios.apiKeyId);
        setApiIssuerId(editingCredential.ios.apiIssuerId);
      } else if (editingCredential.platform === 'android' && editingCredential.android) {
        setServiceAccountEmail(editingCredential.android.serviceAccountEmail || '');
      }
    } else {
      resetForm();
    }
  }, [editingCredential, isOpen]);

  const resetForm = () => {
    setName('');
    setPlatform('ios');
    setTeamId('');
    setApiKeyId('');
    setApiIssuerId('');
    setApiKeyContent('');
    setServiceAccountEmail('');
    setServiceAccountJson('');
    setError(null);
  };

  const handleSave = async () => {
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Please enter a credential name');
      return;
    }

    if (platform === 'ios') {
      if (!teamId.trim() || !apiKeyId.trim() || !apiIssuerId.trim()) {
        setError('Please fill in all iOS credential fields');
        return;
      }
    } else {
      if (!editingCredential && !serviceAccountJson.trim()) {
        setError('Please provide the Service Account JSON');
        return;
      }
    }

    setSaving(true);
    try {
      const credential: Credential = {
        id: editingCredential?.id || `cred-${Date.now()}`,
        name: name.trim(),
        platform,
        ios:
          platform === 'ios'
            ? {
                teamId: teamId.trim(),
                apiKeyId: apiKeyId.trim(),
                apiIssuerId: apiIssuerId.trim(),
              }
            : undefined,
        android:
          platform === 'android'
            ? {
                serviceAccountEmail: serviceAccountEmail.trim() || undefined,
              }
            : undefined,
        createdAt: editingCredential?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      await onSave(
        credential,
        apiKeyContent.trim() || undefined,
        serviceAccountJson.trim() || undefined,
      );

      resetForm();
      onClose();
    } catch (err) {
      setError(err as string);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '90%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
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
            <h2 style={{ fontSize: '20px', fontWeight: 600 }}>
              {editingCredential ? 'Edit Credential' : 'Add New Credential'}
            </h2>
          </div>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '8px', minWidth: 'auto' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: 'var(--spacing-md)',
              backgroundColor: 'rgba(255, 59, 48, 0.1)',
              color: 'var(--color-error)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--spacing-lg)',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          {/* Name */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-sm)',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Credential Name *
            </label>
            <input
              type="text"
              className="btn btn-secondary"
              style={{ width: '100%', textAlign: 'left' }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Production iOS Credentials"
            />
          </div>

          {/* Platform */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-sm)',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Platform *
            </label>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
              <button
                className={`btn ${platform === 'ios' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPlatform('ios')}
                disabled={!!editingCredential}
                style={{ flex: 1 }}
              >
                iOS
              </button>
              <button
                className={`btn ${platform === 'android' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPlatform('android')}
                disabled={!!editingCredential}
                style={{ flex: 1 }}
              >
                Android
              </button>
            </div>
          </div>

          {/* iOS Fields */}
          {platform === 'ios' && (
            <>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-sm)',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  Team ID *
                </label>
                <input
                  type="text"
                  className="btn btn-secondary"
                  style={{ width: '100%', textAlign: 'left', fontFamily: 'monospace' }}
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  placeholder="ABC123XYZ"
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-sm)',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  App Store Connect API Key ID *
                </label>
                <input
                  type="text"
                  className="btn btn-secondary"
                  style={{ width: '100%', textAlign: 'left', fontFamily: 'monospace' }}
                  value={apiKeyId}
                  onChange={(e) => setApiKeyId(e.target.value)}
                  placeholder="ABCD1234EF"
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-sm)',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  App Store Connect API Issuer ID *
                </label>
                <input
                  type="text"
                  className="btn btn-secondary"
                  style={{ width: '100%', textAlign: 'left', fontFamily: 'monospace' }}
                  value={apiIssuerId}
                  onChange={(e) => setApiIssuerId(e.target.value)}
                  placeholder="12345678-1234-1234-1234-123456789012"
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-sm)',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  API Key Content (.p8 file) (optional)
                </label>
                <textarea
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    height: '120px',
                    textAlign: 'left',
                    cursor: 'text',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    padding: 'var(--spacing-md)',
                  }}
                  value={apiKeyContent}
                  onChange={(e) => setApiKeyContent(e.target.value)}
                  placeholder="-----BEGIN PRIVATE KEY-----&#10;MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...&#10;-----END PRIVATE KEY-----"
                />
              </div>
            </>
          )}

          {/* Android Fields */}
          {platform === 'android' && (
            <>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-sm)',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  Service Account Email (optional)
                </label>
                <input
                  type="email"
                  className="btn btn-secondary"
                  style={{ width: '100%', textAlign: 'left', fontFamily: 'monospace' }}
                  value={serviceAccountEmail}
                  onChange={(e) => setServiceAccountEmail(e.target.value)}
                  placeholder="service-account@project.iam.gserviceaccount.com"
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-sm)',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  Service Account JSON {editingCredential ? '(leave empty to keep existing)' : '*'}
                </label>
                <textarea
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    height: '150px',
                    textAlign: 'left',
                    cursor: 'text',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    padding: 'var(--spacing-md)',
                  }}
                  value={serviceAccountJson}
                  onChange={(e) => setServiceAccountJson(e.target.value)}
                  placeholder='{"type": "service_account", "project_id": "...", ...}'
                />
              </div>
            </>
          )}

          {/* Info */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--spacing-sm)',
              padding: 'var(--spacing-md)',
              backgroundColor: 'rgba(0, 122, 255, 0.05)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(0, 122, 255, 0.1)',
            }}
          >
            <Shield
              size={16}
              style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }}
            />
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
              Sensitive data (API keys, JSON files) is stored securely in macOS Keychain. Only
              metadata is saved in the database.
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingCredential ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
