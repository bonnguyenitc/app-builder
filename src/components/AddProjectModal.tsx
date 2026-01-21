import React, { useState, useEffect } from 'react';
import { X, FolderOpen, Key } from 'lucide-react';
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

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        className="card"
        style={{
          width: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 'var(--spacing-md)',
            right: 'var(--spacing-md)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
          }}
        >
          <X size={20} />
        </button>

        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>
          {initialData ? 'Edit Project' : 'Add New Project'}
        </h2>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}
        >
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              Project Name
            </label>
            <input
              className="btn btn-secondary"
              style={{ width: '100%', textAlign: 'left', cursor: 'text' }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Awesome App"
              required
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              Project Root Path
            </label>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <input
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'text',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/Users/me/projects/my-app"
                required
              />
              <button type="button" className="btn btn-secondary" onClick={handleBrowse}>
                <FolderOpen size={16} />
                <span>Browse</span>
              </button>
            </div>
          </div>

          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: 'var(--spacing-xs)',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                iOS Bundle ID
              </label>
              <input
                className="btn btn-secondary"
                style={{ width: '100%', textAlign: 'left', cursor: 'text' }}
                value={iosBundle}
                onChange={(e) => setIosBundle(e.target.value)}
                placeholder="com.example.app"
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: 'var(--spacing-xs)',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Android Package Name
              </label>
              <input
                className="btn btn-secondary"
                style={{ width: '100%', textAlign: 'left', cursor: 'text' }}
                value={androidBundle}
                onChange={(e) => setAndroidBundle(e.target.value)}
                placeholder="com.example.app"
              />
            </div>
          </div>

          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: 'var(--spacing-xs)',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                iOS Version
              </label>
              <input
                className="btn btn-secondary"
                style={{ width: '100%', textAlign: 'left', cursor: 'text' }}
                value={iosVersion}
                onChange={(e) => setIosVersion(e.target.value)}
                placeholder="1.0.0"
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: 'var(--spacing-xs)',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Android Version
              </label>
              <input
                className="btn btn-secondary"
                style={{ width: '100%', textAlign: 'left', cursor: 'text' }}
                value={androidVersion}
                onChange={(e) => setAndroidVersion(e.target.value)}
                placeholder="1.0.0"
              />
            </div>
          </div>

          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: 'var(--spacing-xs)',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                iOS Build Number
              </label>
              <input
                type="number"
                className="btn btn-secondary"
                style={{ width: '100%', textAlign: 'left', cursor: 'text' }}
                value={iosBuildNumber}
                onChange={(e) => setIosBuildNumber(parseInt(e.target.value) || 0)}
                placeholder="1"
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: 'var(--spacing-xs)',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Android Version Code
              </label>
              <input
                type="number"
                className="btn btn-secondary"
                style={{ width: '100%', textAlign: 'left', cursor: 'text' }}
                value={androidBuildNumber}
                onChange={(e) => setAndroidBuildNumber(parseInt(e.target.value) || 0)}
                placeholder="1"
              />
            </div>
          </div>

          <div
            style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)' }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
              iOS Configuration
            </h3>
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  Scheme
                </label>
                <input
                  className="btn btn-secondary"
                  style={{ width: '100%', textAlign: 'left', cursor: 'text' }}
                  value={iosScheme}
                  onChange={(e) => setIosScheme(e.target.value)}
                  placeholder="MyApp"
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  Configuration
                </label>
                <input
                  className="btn btn-secondary"
                  style={{ width: '100%', textAlign: 'left', cursor: 'text' }}
                  value={iosConfiguration}
                  onChange={(e) => setIosConfiguration(e.target.value)}
                  placeholder="Release"
                />
              </div>
            </div>

            <div style={{ marginTop: 'var(--spacing-md)' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 'var(--spacing-xs)',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Export Method
              </label>
              <select
                className="btn btn-secondary"
                style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
                value={iosExportMethod}
                onChange={(e) => setIosExportMethod(e.target.value as any)}
              >
                <option value="development">Development - For testing on registered devices</option>
                <option value="ad-hoc">Ad-Hoc - For distribution outside App Store</option>
                <option value="app-store">App Store - For App Store submission</option>
                <option value="enterprise">Enterprise - For enterprise distribution</option>
              </select>
            </div>

            <div style={{ marginTop: 'var(--spacing-md)' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 'var(--spacing-xs)',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                iOS Credential
                <span
                  style={{
                    color: 'var(--color-text-secondary)',
                    fontWeight: 400,
                    marginLeft: '4px',
                  }}
                >
                  (optional)
                </span>
              </label>
              <select
                className="btn btn-secondary"
                style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
                value={selectedIosCredentialId}
                onChange={(e) => setSelectedIosCredentialId(e.target.value)}
              >
                <option value="">None - Manual configuration</option>
                {iosCredentials.map((cred) => (
                  <option key={cred.id} value={cred.id}>
                    {cred.name} ({cred.ios?.teamId})
                  </option>
                ))}
              </select>
              {iosCredentials.length === 0 && (
                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                    marginTop: 'var(--spacing-xs)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Key size={12} />
                  No iOS credentials configured. Go to Settings to add one.
                </p>
              )}
            </div>
          </div>

          <div
            style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)' }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
              Android Configuration
            </h3>

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: 'var(--spacing-xs)',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Android Credential
                <span
                  style={{
                    color: 'var(--color-text-secondary)',
                    fontWeight: 400,
                    marginLeft: '4px',
                  }}
                >
                  (optional)
                </span>
              </label>
              <select
                className="btn btn-secondary"
                style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
                value={selectedAndroidCredentialId}
                onChange={(e) => setSelectedAndroidCredentialId(e.target.value)}
              >
                <option value="">None - Manual configuration</option>
                {androidCredentials.map((cred) => (
                  <option key={cred.id} value={cred.id}>
                    {cred.name}
                    {cred.android?.serviceAccountEmail && ` (${cred.android.serviceAccountEmail})`}
                  </option>
                ))}
              </select>
              {androidCredentials.length === 0 && (
                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                    marginTop: 'var(--spacing-xs)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Key size={12} />
                  No Android credentials configured. Go to Settings to add one.
                </p>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--spacing-md)',
              marginTop: 'var(--spacing-lg)',
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
