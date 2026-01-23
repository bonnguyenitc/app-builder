import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { invoke } from '@tauri-apps/api/core';
import { PermissionsResult, Permission } from '../types/permissions';
import {
  AndroidIcon,
  AppleIcon,
  LoaderIcon,
  ChevronLeftIcon,
  ShieldIcon,
} from '../components/Icons';

export const PermissionsManager: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects } = useProjectStore();
  const project = projects.find((p) => p.id === projectId);

  const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android');
  const [permissions, setPermissions] = useState<PermissionsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      loadPermissions();
    }
  }, [project]);

  const loadPermissions = async () => {
    if (!project) return;
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<PermissionsResult>('get_project_permissions', {
        projectPath: project.path,
      });
      setPermissions(result);
    } catch (err) {
      setError((err as Error).toString());
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (perm: Permission) => {
    if (!project || updating) return;
    setUpdating(perm.key);
    try {
      await invoke('update_permission', {
        projectPath: project.path,
        payload: {
          platform: activeTab,
          key: perm.key,
          enabled: !perm.enabled,
          description: perm.description,
        },
      });

      // Update local state optimistic
      if (permissions) {
        const updateList = (list: Permission[]) =>
          list.map((p) => (p.key === perm.key ? { ...p, enabled: !p.enabled } : p));

        setPermissions({
          ...permissions,
          [activeTab]: updateList(permissions[activeTab]),
        });
      }
    } catch (err) {
      console.error(err);
      // Revert or show error could be done here, but simpler to just log
    } finally {
      setUpdating(null);
    }
  };

  const handleDescriptionChange = async (perm: Permission, newDesc: string) => {
    if (!project) return;
    // Don't invoke update immediately, maybe on blur or enter?
    // For simplicity, let's just update local state first then save on blur
    if (permissions) {
      const updateList = (list: Permission[]) =>
        list.map((p) => (p.key === perm.key ? { ...p, description: newDesc } : p));

      setPermissions({
        ...permissions,
        ios: updateList(permissions.ios),
      });
    }
  };

  const saveDescription = async (perm: Permission) => {
    if (!project) return;
    try {
      await invoke('update_permission', {
        projectPath: project.path,
        payload: {
          platform: 'ios',
          key: perm.key,
          enabled: perm.enabled,
          description: perm.description,
        },
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (!project) {
    return (
      <div className="empty-state">
        <h2>Project not found</h2>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="permissions-page">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        <button onClick={() => navigate('/')} className="btn btn-ghost" style={{ padding: '8px' }}>
          <ChevronLeftIcon size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>
            Permissions Manager
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            {project.name} • {activeTab === 'android' ? 'AndroidManifest.xml' : 'Info.plist'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <button
          className={`tab ${activeTab === 'android' ? 'active' : ''}`}
          onClick={() => setActiveTab('android')}
        >
          <AndroidIcon size={16} />
          <span>Android</span>
        </button>
        <button
          className={`tab ${activeTab === 'ios' ? 'active' : ''}`}
          onClick={() => setActiveTab('ios')}
        >
          <AppleIcon size={16} />
          <span>iOS</span>
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <LoaderIcon className="animate-spin" size={32} />
        </div>
      ) : error ? (
        <div className="card" style={{ padding: '20px', color: 'var(--color-error)' }}>
          Error: {error}
        </div>
      ) : (
        <div
          className="permissions-list"
          style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-md)' }}
        >
          {permissions &&
            permissions[activeTab].map((perm) => (
              <div
                key={perm.key}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--spacing-md)',
                  backgroundColor: perm.enabled ? 'rgba(0, 122, 255, 0.03)' : 'var(--glass-bg)',
                  border: perm.enabled
                    ? '1px solid rgba(0, 122, 255, 0.2)'
                    : '1px solid var(--color-border)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <ShieldIcon
                      size={16}
                      style={{
                        color: perm.enabled ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                      }}
                    />
                    <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{perm.name}</h3>
                  </div>
                  <code
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-text-secondary)',
                      display: 'block',
                      marginBottom: '8px',
                    }}
                  >
                    {perm.key}
                  </code>
                  {perm.explanation && (
                    <p style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: 1.5 }}>
                      {perm.explanation}
                    </p>
                  )}

                  {activeTab === 'ios' && perm.enabled && (
                    <div style={{ marginTop: '12px' }}>
                      <label
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          display: 'block',
                          marginBottom: '8px',
                        }}
                      >
                        Usage Description
                      </label>
                      <input
                        className="input"
                        value={perm.description || ''}
                        onChange={(e) => handleDescriptionChange(perm, e.target.value)}
                        onBlur={() => saveDescription(perm)}
                        placeholder="Why do you need this permission?"
                        style={{ width: '100%', fontSize: '13px' }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ marginLeft: '20px' }}>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={perm.enabled}
                      onChange={() => handleToggle(perm)}
                      disabled={updating === perm.key}
                    />
                    <span className="slider round"></span>
                  </label>
                  {updating === perm.key && (
                    <LoaderIcon
                      size={12}
                      className="animate-spin"
                      style={{ position: 'absolute', right: '-20px' }}
                    />
                  )}
                </div>
              </div>
            ))}

          {permissions && permissions[activeTab].length === 0 && (
            <p>No permissions found configured.</p>
          )}
        </div>
      )}

      <style>{`
        .tabs {
            display: flex;
            gap: 1rem;
            border-bottom: 1px solid var(--color-border);
        }
        .tab {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            background: none;
            border: none;
            border-bottom: 2px solid transparent;
            color: var(--color-text-secondary);
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
        }
        .tab.active {
            color: var(--color-primary);
            border-bottom-color: var(--color-primary);
        }
        .tab:hover:not(.active) {
            color: var(--color-text);
        }

        /* Toggle Switch */
        .toggle-switch {
            position: relative;
            display: inline-block;
            width: 44px;
            height: 24px;
        }
        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: var(--color-border);
            transition: .4s;
        }
        .slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .4s;
        }
        input:checked + .slider {
            background-color: var(--color-primary);
        }
        input:focus + .slider {
            box-shadow: 0 0 1px var(--color-primary);
        }
        input:checked + .slider:before {
            transform: translateX(20px);
        }
        .slider.round {
            border-radius: 24px;
        }
        .slider.round:before {
            border-radius: 50%;
        }
      `}</style>
    </div>
  );
};
