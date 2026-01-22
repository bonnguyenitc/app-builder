import React, { useState, useEffect } from 'react';
import { X, FolderOpen, Key, Apple, Smartphone, Package, Settings2, Sparkles } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { Project } from '../types/project';
import { useCredentials } from '../hooks/useCredentials';

interface AppJsonInfo {
  name: string | null;
  ios_bundle_id: string | null;
  android_package: string | null;
  ios_version: string | null;
  android_version: string | null;
  ios_build_number: string | null;
  android_version_code: number | null;
}

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Omit<Project, 'id'>) => void;
  initialData?: Project;
}

export const AddProjectModal: React.FC<AddProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const { credentials } = useCredentials();
  const [name, setName] = useState(initialData?.name || '');
  const [path, setPath] = useState(initialData?.path || '');
  const [iosBundle, setIosBundle] = useState(initialData?.ios.bundleId || '');
  const [androidBundle, setAndroidBundle] = useState(initialData?.android.bundleId || '');
  const [iosVersion, setIosVersion] = useState(initialData?.ios.version || '1.0.0');
  const [androidVersion, setAndroidVersion] = useState(initialData?.android.version || '1.0.0');
  const [iosBuildNumber, setIosBuildNumber] = useState(initialData?.ios.buildNumber || 1);
  const [androidBuildNumber, setAndroidBuildNumber] = useState(
    initialData?.android.versionCode || 1,
  );

  const [iosScheme, setIosScheme] = useState(initialData?.ios.config?.scheme || '');
  const [iosConfiguration, setIosConfiguration] = useState(
    initialData?.ios.config?.configuration || 'Release',
  );
  const [iosExportMethod, setIosExportMethod] = useState<
    'development' | 'ad-hoc' | 'app-store' | 'enterprise'
  >(initialData?.ios.config?.exportMethod || 'development');

  // Credential selection
  const [selectedIosCredentialId, setSelectedIosCredentialId] = useState<string>('');
  const [selectedAndroidCredentialId, setSelectedAndroidCredentialId] = useState<string>('');

  const iosCredentials = credentials.filter((c) => c.platform === 'ios');
  const androidCredentials = credentials.filter((c) => c.platform === 'android');

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setPath(initialData?.path || '');
      setIosBundle(initialData?.ios.bundleId || '');
      setAndroidBundle(initialData?.android.bundleId || '');
      setIosVersion(initialData?.ios.version || '1.0.0');
      setAndroidVersion(initialData?.android.version || '1.0.0');
      setIosBuildNumber(initialData?.ios.buildNumber || 1);
      setAndroidBuildNumber(initialData?.android.versionCode || 1);

      setIosScheme(initialData?.ios.config?.scheme || initialData?.name || '');
      setIosConfiguration(initialData?.ios.config?.configuration || 'Release');
      setIosExportMethod(initialData?.ios.config?.exportMethod || 'development');

      // Reset credential selections
      setSelectedIosCredentialId('');
      setSelectedAndroidCredentialId('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleBrowse = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select React Native Project Root',
      });
      if (selected && typeof selected === 'string') {
        setPath(selected);

        // Try to read from native files (Info.plist and build.gradle) and auto-fill fields
        try {
          const appInfo = await invoke<AppJsonInfo>('read_native_project_info', {
            projectPath: selected,
          });
          if (appInfo.name) {
            setName(appInfo.name);
            if (!iosScheme) setIosScheme(appInfo.name);
          }
          if (appInfo.ios_bundle_id) setIosBundle(appInfo.ios_bundle_id);
          if (appInfo.android_package) setAndroidBundle(appInfo.android_package);
          if (appInfo.ios_version) setIosVersion(appInfo.ios_version);
          if (appInfo.android_version) setAndroidVersion(appInfo.android_version);
          if (appInfo.ios_build_number) {
            const parsed = parseInt(appInfo.ios_build_number);
            if (!isNaN(parsed)) setIosBuildNumber(parsed);
          }
          if (appInfo.android_version_code) setAndroidBuildNumber(appInfo.android_version_code);
        } catch (error) {
          console.log('Could not read native project info:', error);
          // Fallback to folder name
          if (!name) {
            const folderName = selected.split('/').pop();
            if (folderName) {
              setName(folderName);
              if (!iosScheme) setIosScheme(folderName);
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to open dialog', e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Get selected credentials
    const selectedIosCredential = iosCredentials.find((c) => c.id === selectedIosCredentialId);

    // Build iOS config with credential info
    const iosConfig =
      (iosScheme || name) && (iosConfiguration || 'Release')
        ? {
            scheme: iosScheme || name,
            configuration: iosConfiguration || 'Release',
            teamId: selectedIosCredential?.ios?.teamId || undefined,
            exportMethod: iosExportMethod,
            apiKey: selectedIosCredential?.ios?.apiKeyId || undefined,
            apiIssuer: selectedIosCredential?.ios?.apiIssuerId || undefined,
          }
        : undefined;

    onSave({
      name,
      path,
      ios: {
        bundleId: iosBundle,
        version: iosVersion,
        buildNumber: iosBuildNumber,
        config: iosConfig,
      },
      android: {
        bundleId: androidBundle,
        version: androidVersion,
        versionCode: androidBuildNumber,
      },
      credentials: initialData?.credentials || {},
    });
    onClose();
  };

  // Reusable input styles
  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    fontSize: '14px',
    color: 'var(--color-text)',
    transition: 'all var(--transition-fast)',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-text)',
  };

  const sectionStyle = {
    padding: 'var(--spacing-md)',
    background: 'var(--color-sidebar)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="card modal-content"
        style={{
          width: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--spacing-lg)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--color-sidebar)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)',
              }}
            >
              <Package size={22} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '2px' }}>
                {initialData ? 'Edit Project' : 'Add New Project'}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Configure your mobile app project settings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '8px', borderRadius: 'var(--radius-sm)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ padding: 'var(--spacing-lg)' }}>
          {/* Basic Info Section */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                marginBottom: 'var(--spacing-md)',
              }}
            >
              <Sparkles size={16} style={{ color: 'var(--color-primary)' }} />
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
                    onClick={handleBrowse}
                    style={{ flexShrink: 0, gap: '6px' }}
                  >
                    <FolderOpen size={16} />
                    <span>Browse</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Sections - Side by Side */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-lg)',
            }}
          >
            {/* iOS Section */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  marginBottom: 'var(--spacing-md)',
                }}
              >
                <div className="icon-container icon-container-primary" style={{ padding: '4px' }}>
                  <Apple size={14} />
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: 600 }}>iOS</h3>
              </div>

              <div style={sectionStyle}>
                <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                  <label style={labelStyle}>Bundle ID</label>
                  <input
                    style={inputStyle}
                    value={iosBundle}
                    onChange={(e) => setIosBundle(e.target.value)}
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
                      value={iosVersion}
                      onChange={(e) => setIosVersion(e.target.value)}
                      placeholder="1.0.0"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Build Number</label>
                    <input
                      type="number"
                      style={inputStyle}
                      value={iosBuildNumber}
                      onChange={(e) => setIosBuildNumber(parseInt(e.target.value) || 0)}
                      placeholder="1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Android Section */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  marginBottom: 'var(--spacing-md)',
                }}
              >
                <div className="icon-container icon-container-success" style={{ padding: '4px' }}>
                  <Smartphone size={14} />
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Android</h3>
              </div>

              <div style={sectionStyle}>
                <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                  <label style={labelStyle}>Package Name</label>
                  <input
                    style={inputStyle}
                    value={androidBundle}
                    onChange={(e) => setAndroidBundle(e.target.value)}
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
                      value={androidVersion}
                      onChange={(e) => setAndroidVersion(e.target.value)}
                      placeholder="1.0.0"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Version Code</label>
                    <input
                      type="number"
                      style={inputStyle}
                      value={androidBuildNumber}
                      onChange={(e) => setAndroidBuildNumber(parseInt(e.target.value) || 0)}
                      placeholder="1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* iOS Configuration */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                marginBottom: 'var(--spacing-md)',
              }}
            >
              <Settings2 size={16} style={{ color: 'var(--color-primary)' }} />
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
                    value={iosScheme}
                    onChange={(e) => setIosScheme(e.target.value)}
                    placeholder="MyApp"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Configuration</label>
                  <input
                    style={inputStyle}
                    value={iosConfiguration}
                    onChange={(e) => setIosConfiguration(e.target.value)}
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
                    value={iosExportMethod}
                    onChange={(e) => setIosExportMethod(e.target.value as any)}
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
                    value={selectedIosCredentialId}
                    onChange={(e) => setSelectedIosCredentialId(e.target.value)}
                  >
                    <option value="">None</option>
                    {iosCredentials.map((cred) => (
                      <option key={cred.id} value={cred.id}>
                        {cred.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {iosCredentials.length === 0 && (
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
                  <Key size={12} />
                  No iOS credentials. Add one in Settings to enable App Store uploads.
                </p>
              )}
            </div>
          </div>

          {/* Android Configuration */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                marginBottom: 'var(--spacing-md)',
              }}
            >
              <Settings2 size={16} style={{ color: 'var(--color-success)' }} />
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
                  value={selectedAndroidCredentialId}
                  onChange={(e) => setSelectedAndroidCredentialId(e.target.value)}
                >
                  <option value="">None</option>
                  {androidCredentials.map((cred) => (
                    <option key={cred.id} value={cred.id}>
                      {cred.name}
                      {cred.android?.serviceAccountEmail &&
                        ` (${cred.android.serviceAccountEmail})`}
                    </option>
                  ))}
                </select>
              </div>

              {androidCredentials.length === 0 && (
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
                  <Key size={12} />
                  No Android credentials. Add one in Settings to enable Play Store uploads.
                </p>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--spacing-sm)',
              paddingTop: 'var(--spacing-md)',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {initialData ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
