import React, { useEffect } from 'react';
import { CloseIcon, AppleIcon, AndroidIcon, PackageIcon } from './Icons';
import { Project } from '../types/project';
import { useProjectForm } from '../hooks/useProjectForm';
import { GeneralInfoSection } from './AddProject/GeneralInfoSection';
import { PlatformConfigSection } from './AddProject/PlatformConfigSection';
import { IosBuildSettings } from './AddProject/IosBuildSettings';
import { AndroidBuildSettings } from './AddProject/AndroidBuildSettings';

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
  const { states, handlers } = useProjectForm(initialData, isOpen, onClose, onSave);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
              <PackageIcon size={22} style={{ color: 'white' }} />
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
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handlers.handleSubmit} style={{ padding: 'var(--spacing-lg)' }}>
          <GeneralInfoSection
            name={states.name}
            setName={states.setName}
            path={states.path}
            setPath={states.setPath}
            onBrowse={handlers.handleBrowse}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-lg)',
            }}
          >
            <PlatformConfigSection
              title="iOS"
              icon={<AppleIcon size={14} />}
              iconContainerClass="icon-container-primary"
              bundleIdLabel="Bundle ID"
              bundleId={states.iosBundle}
              setBundleId={states.setIosBundle}
              version={states.iosVersion}
              setVersion={states.setIosVersion}
              buildNumber={states.iosBuildNumber}
              setBuildNumber={states.setIosBuildNumber}
              buildNumberLabel="Build Number"
            />

            <PlatformConfigSection
              title="Android"
              icon={<AndroidIcon size={14} />}
              iconContainerClass="icon-container-success"
              bundleIdLabel="Package Name"
              bundleId={states.androidBundle}
              setBundleId={states.setAndroidBundle}
              version={states.androidVersion}
              setVersion={states.setAndroidVersion}
              buildNumber={states.androidBuildNumber}
              setBuildNumber={states.setAndroidBuildNumber}
              buildNumberLabel="Version Code"
            />
          </div>

          <IosBuildSettings
            scheme={states.iosScheme}
            setScheme={states.setIosScheme}
            configuration={states.iosConfiguration}
            setConfiguration={states.setIosConfiguration}
            exportMethod={states.iosExportMethod}
            setExportMethod={states.setIosExportMethod}
            selectedCredentialId={states.selectedIosCredentialId}
            setSelectedCredentialId={states.setSelectedIosCredentialId}
            credentials={states.iosCredentials}
          />

          <AndroidBuildSettings
            selectedCredentialId={states.selectedAndroidCredentialId}
            setSelectedCredentialId={states.setSelectedAndroidCredentialId}
            credentials={states.androidCredentials}
          />

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
