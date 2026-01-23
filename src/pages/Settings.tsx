import React, { useState } from 'react';
import {
  AppleIcon,
  AndroidIcon,
  ShieldIcon,
  KeyIcon,
  TrashIcon,
  CheckCircleIcon,
  PlusIcon,
  EditIcon,
  LockIcon,
  SparklesIcon,
} from '../components/Icons';
import { useCredentials } from '../hooks/useCredentials';
import { CredentialModal } from '../components/CredentialModal';
import { Credential } from '../types/credential';

export const Settings: React.FC = () => {
  const { credentials, loading, createCredential, updateCredential, deleteCredential } =
    useCredentials();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [deletingCredential, setDeletingCredential] = useState<Credential | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && deletingCredential) {
        setDeletingCredential(null);
      }
    };

    if (deletingCredential) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [deletingCredential]);

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

  const handleDeleteCredential = (credential: Credential) => {
    setDeletingCredential(credential);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCredential) return;

    try {
      await deleteCredential(deletingCredential.id, deletingCredential.platform);
      setStatus({ type: 'success', message: 'Credential deleted successfully' });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus({ type: 'error', message: `Failed to delete credential: ${err}` });
    } finally {
      setDeletingCredential(null);
    }
  };

  const iosCredentials = credentials.filter((c) => c.platform === 'ios');
  const androidCredentials = credentials.filter((c) => c.platform === 'android');

  return (
    <div className="settings-page" style={{ width: '100%' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            marginBottom: '4px',
            color: 'var(--color-primary)',
          }}
        >
          Settings
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Manage secure credentials for app distribution
        </p>
      </div>

      {/* Status Toast */}
      {status && (
        <div
          className="card"
          style={{
            padding: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-lg)',
            background:
              status.type === 'success'
                ? 'linear-gradient(135deg, rgba(52, 199, 89, 0.1) 0%, rgba(52, 199, 89, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(255, 59, 48, 0.1) 0%, rgba(255, 59, 48, 0.05) 100%)',
            border: `1px solid ${status.type === 'success' ? 'rgba(52, 199, 89, 0.3)' : 'rgba(255, 59, 48, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            animation: 'fadeInUp 0.3s ease-out',
          }}
        >
          <div
            className={`icon-container ${status.type === 'success' ? 'icon-container-success' : 'icon-container-error'}`}
          >
            {status.type === 'success' ? <CheckCircleIcon size={18} /> : <ShieldIcon size={18} />}
          </div>
          <span
            style={{
              color: status.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
              fontWeight: 500,
            }}
          >
            {status.message}
          </span>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--gradient-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)',
                }}
              >
                <AppleIcon size={22} style={{ color: 'white' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600 }}>iOS Credentials</h2>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  App Store Connect API credentials for iOS builds
                </p>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <PlusIcon size={16} />
              <span>Add Credential</span>
            </button>
          </div>

          {loading ? (
            <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
              <div className="skeleton skeleton-title" style={{ margin: '0 auto' }} />
              <div className="skeleton skeleton-text" style={{ width: '80%', margin: '0 auto' }} />
            </div>
          ) : iosCredentials.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--spacing-2xl)',
                background:
                  'linear-gradient(135deg, var(--color-sidebar) 0%, var(--color-bg) 100%)',
                borderRadius: 'var(--radius-md)',
                border: '2px dashed var(--color-border)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'var(--color-primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--spacing-md)',
                }}
              >
                <KeyIcon size={24} style={{ color: 'var(--color-primary)' }} />
              </div>
              <p style={{ fontSize: '15px', fontWeight: 500, marginBottom: '4px' }}>
                No iOS credentials configured
              </p>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Add your first credential to start building iOS apps
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {iosCredentials.map((credential, index) => (
                <div
                  key={credential.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--spacing-md)',
                    background:
                      'linear-gradient(135deg, var(--color-sidebar) 0%, var(--color-surface) 100%)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    transition: 'all var(--transition-fast)',
                    animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`,
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
                      <span className="badge badge-primary">iOS</span>
                    </div>
                    {credential.ios && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-text-secondary)',
                          fontFamily:
                            "'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace",
                        }}
                      >
                        Team ID: {credential.ios.teamId} • Key ID: {credential.ios.apiKeyId}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleOpenModal(credential)}
                      style={{ padding: '8px' }}
                    >
                      <EditIcon size={16} />
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleDeleteCredential(credential)}
                      style={{ padding: '8px', color: 'var(--color-error)' }}
                    >
                      <TrashIcon size={16} />
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--gradient-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(52, 199, 89, 0.3)',
                }}
              >
                <AndroidIcon size={22} style={{ color: 'white' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Android Credentials</h2>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  Google Play Console service account credentials
                </p>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <PlusIcon size={16} />
              <span>Add Credential</span>
            </button>
          </div>

          {loading ? (
            <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
              <div className="skeleton skeleton-title" style={{ margin: '0 auto' }} />
              <div className="skeleton skeleton-text" style={{ width: '80%', margin: '0 auto' }} />
            </div>
          ) : androidCredentials.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--spacing-2xl)',
                background:
                  'linear-gradient(135deg, var(--color-sidebar) 0%, var(--color-bg) 100%)',
                borderRadius: 'var(--radius-md)',
                border: '2px dashed var(--color-border)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(52, 199, 89, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--spacing-md)',
                }}
              >
                <KeyIcon size={24} style={{ color: 'var(--color-success)' }} />
              </div>
              <p style={{ fontSize: '15px', fontWeight: 500, marginBottom: '4px' }}>
                No Android credentials configured
              </p>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Add your first credential to start building Android apps
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {androidCredentials.map((credential, index) => (
                <div
                  key={credential.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--spacing-md)',
                    background:
                      'linear-gradient(135deg, var(--color-sidebar) 0%, var(--color-surface) 100%)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    transition: 'all var(--transition-fast)',
                    animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`,
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
                      <span className="badge badge-success">Android</span>
                    </div>
                    {credential.android?.serviceAccountEmail && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-text-secondary)',
                          fontFamily:
                            "'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace",
                        }}
                      >
                        {credential.android.serviceAccountEmail}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleOpenModal(credential)}
                      style={{ padding: '8px' }}
                    >
                      <EditIcon size={16} />
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleDeleteCredential(credential)}
                      style={{ padding: '8px', color: 'var(--color-error)' }}
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Info Section */}
        <section
          className="card"
          style={{
            background:
              'linear-gradient(135deg, rgba(0, 122, 255, 0.05) 0%, rgba(88, 86, 214, 0.05) 100%)',
            border: '1px solid rgba(0, 122, 255, 0.15)',
          }}
        >
          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--gradient-premium)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              }}
            >
              <LockIcon size={20} color="white" />
            </div>
            <div>
              <h4
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                }}
              >
                Secure Storage
                <SparklesIcon size={14} style={{ color: 'var(--color-primary)' }} />
              </h4>
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                Your credentials are saved directly into the macOS Keychain. Sensitive data (API
                keys, JSON files) is encrypted and never stored in the database. Only metadata is
                saved locally for easy management.
              </p>
            </div>
          </div>
        </section>
      </div>

      <CredentialModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCredential}
        editingCredential={editingCredential}
      />

      {/* Delete Confirmation Modal */}
      {deletingCredential && (
        <div className="modal-overlay" onClick={() => setDeletingCredential(null)}>
          <div
            className="card modal-content"
            style={{
              maxWidth: '420px',
              padding: 'var(--spacing-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(255, 59, 48, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--spacing-lg)',
              }}
            >
              <TrashIcon size={28} style={{ color: 'var(--color-error)' }} />
            </div>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                marginBottom: 'var(--spacing-sm)',
                textAlign: 'center',
              }}
            >
              Delete Credential
            </h2>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--spacing-xl)',
                textAlign: 'center',
                lineHeight: 1.6,
              }}
            >
              Are you sure you want to delete "<strong>{deletingCredential.name}</strong>"? This
              action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setDeletingCredential(null)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleConfirmDelete} style={{ flex: 1 }}>
                Delete Credential
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
