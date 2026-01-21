import React, { useState } from 'react';
import { Shield, Key, Trash2, CheckCircle2, Plus, Edit2, Apple, Bot } from 'lucide-react';
import { useCredentials } from '../hooks/useCredentials';
import { CredentialModal } from '../components/CredentialModal';
import { Credential } from '../types/credential';

export const Settings: React.FC = () => {
  const { credentials, loading, createCredential, updateCredential, deleteCredential } =
    useCredentials();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleOpenModal = (credential?: Credential) => {
    setEditingCredential(credential || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCredential(null);
  };

  const handleSaveCredential = async (
    credential: Credential,
    apiKeyContent?: string,
    serviceAccountJson?: string,
  ) => {
    try {
      if (editingCredential) {
        await updateCredential(credential, apiKeyContent, serviceAccountJson);
        setStatus({ type: 'success', message: 'Credential updated successfully' });
      } else {
        await createCredential(credential, apiKeyContent, serviceAccountJson);
        setStatus({ type: 'success', message: 'Credential created successfully' });
      }
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus({ type: 'error', message: `Failed to save credential: ${err}` });
    }
  };

  const handleDeleteCredential = async (credential: Credential) => {
    if (!confirm(`Are you sure you want to delete "${credential.name}"?`)) {
      return;
    }

    try {
      await deleteCredential(credential.id, credential.platform);
      setStatus({ type: 'success', message: 'Credential deleted successfully' });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus({ type: 'error', message: `Failed to delete credential: ${err}` });
    }
  };

  const iosCredentials = credentials.filter((c) => c.platform === 'ios');
  const androidCredentials = credentials.filter((c) => c.platform === 'android');

  return (
    <div className="settings-page" style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Settings</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Manage secure credentials for app distribution
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
        {/* iOS Credentials Section */}
        <section className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
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
                <Apple size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 600 }}>iOS Credentials</h2>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  App Store Connect API credentials for iOS builds
                </p>
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => handleOpenModal()}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}
            >
              <Plus size={16} />
              <span>Add Credential</span>
            </button>
          </div>

          {loading ? (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--spacing-xl)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Loading credentials...
            </div>
          ) : iosCredentials.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--spacing-xl)',
                backgroundColor: 'var(--color-sidebar)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <Key size={32} style={{ margin: '0 auto var(--spacing-md)', opacity: 0.5 }} />
              <p style={{ fontSize: '14px' }}>No iOS credentials configured</p>
              <p style={{ fontSize: '13px', marginTop: 'var(--spacing-sm)' }}>
                Add your first credential to start building iOS apps
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {iosCredentials.map((credential) => (
                <div
                  key={credential.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--spacing-md)',
                    backgroundColor: 'var(--color-sidebar)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        marginBottom: '4px',
                      }}
                    >
                      <h3 style={{ fontSize: '15px', fontWeight: 600 }}>{credential.name}</h3>
                      <div
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(0, 122, 255, 0.1)',
                          color: 'var(--color-primary)',
                          fontSize: '11px',
                          fontWeight: 500,
                        }}
                      >
                        iOS
                      </div>
                    </div>
                    {credential.ios && (
                      <div
                        style={{
                          fontSize: '13px',
                          color: 'var(--color-text-secondary)',
                          fontFamily: 'monospace',
                        }}
                      >
                        Team ID: {credential.ios.teamId} • Key ID: {credential.ios.apiKeyId}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleOpenModal(credential)}
                      style={{ padding: '8px 12px', minWidth: 'auto' }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleDeleteCredential(credential)}
                      style={{ padding: '8px 12px', minWidth: 'auto', color: 'var(--color-error)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Android Credentials Section */}
        <section className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--spacing-lg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <div
                style={{
                  padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(52, 199, 89, 0.1)',
                  color: 'var(--color-success)',
                }}
              >
                <Bot size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 600 }}>Android Credentials</h2>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  Google Play Console service account credentials
                </p>
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => handleOpenModal()}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}
            >
              <Plus size={16} />
              <span>Add Credential</span>
            </button>
          </div>

          {loading ? (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--spacing-xl)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Loading credentials...
            </div>
          ) : androidCredentials.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--spacing-xl)',
                backgroundColor: 'var(--color-sidebar)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <Key size={32} style={{ margin: '0 auto var(--spacing-md)', opacity: 0.5 }} />
              <p style={{ fontSize: '14px' }}>No Android credentials configured</p>
              <p style={{ fontSize: '13px', marginTop: 'var(--spacing-sm)' }}>
                Add your first credential to start building Android apps
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {androidCredentials.map((credential) => (
                <div
                  key={credential.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--spacing-md)',
                    backgroundColor: 'var(--color-sidebar)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        marginBottom: '4px',
                      }}
                    >
                      <h3 style={{ fontSize: '15px', fontWeight: 600 }}>{credential.name}</h3>
                      <div
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(52, 199, 89, 0.1)',
                          color: 'var(--color-success)',
                          fontSize: '11px',
                          fontWeight: 500,
                        }}
                      >
                        Android
                      </div>
                    </div>
                    {credential.android?.serviceAccountEmail && (
                      <div
                        style={{
                          fontSize: '13px',
                          color: 'var(--color-text-secondary)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {credential.android.serviceAccountEmail}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleOpenModal(credential)}
                      style={{ padding: '8px 12px', minWidth: 'auto' }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleDeleteCredential(credential)}
                      style={{ padding: '8px 12px', minWidth: 'auto', color: 'var(--color-error)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
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
              Your credentials are saved directly into the macOS Keychain. Sensitive data (API keys,
              JSON files) is encrypted and never stored in the database. Only metadata is saved
              locally for easy management.
            </p>
          </div>
        </section>
      </div>

      {/* Credential Modal */}
      <CredentialModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCredential}
        editingCredential={editingCredential}
      />
    </div>
  );
};
