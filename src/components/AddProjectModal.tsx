import React, { useEffect, useState } from 'react';
import {
  CloseIcon,
  AppleIcon,
  AndroidIcon,
  PackageIcon,
  SparklesIcon,
  SettingsIcon,
  PlusIcon,
} from './Icons';
import { Project } from '../types/project';
import { useProjectForm } from '../hooks/useProjectForm';
import { GeneralInfoSection } from './AddProject/GeneralInfoSection';
import { PlatformConfigSection } from './AddProject/PlatformConfigSection';
import { IosBuildSettings } from './AddProject/IosBuildSettings';
import { AndroidBuildSettings } from './AddProject/AndroidBuildSettings';
import { NotificationSettings } from './AddProject/NotificationSettings';
import {
  sidebarStyle,
  sidebarItemStyle,
  contentAreaStyle,
  modalLayout,
} from './AddProject/AddProject.styles';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Omit<Project, 'id'>) => void;
  initialData?: Project;
}

type TabType = 'basic' | 'platforms' | 'configs' | 'notifications';

export const AddProjectModal: React.FC<AddProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const { states, handlers } = useProjectForm(initialData, isOpen, onClose, onSave);
  const [activeTab, setActiveTab] = useState<TabType>('basic');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      setActiveTab('basic');
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic', label: 'General', icon: <SparklesIcon size={14} /> },
    { id: 'platforms', label: 'Platforms', icon: <PackageIcon size={14} /> },
    { id: 'configs', label: 'Build Config', icon: <SettingsIcon size={14} /> },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <PlusIcon size={14} style={{ transform: 'rotate(45deg)' }} />,
    },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="card modal-content"
        style={{
          width: '800px', // Wider for sidebar
          maxHeight: '90vh',
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--spacing-md) var(--spacing-lg)',
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
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PackageIcon size={18} style={{ color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700 }}>
                {initialData ? 'Edit Project' : 'Create Project'}
              </h2>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                {states.name || 'Untitled Project'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '4px', borderRadius: 'var(--radius-sm)' }}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Modal Body with Sidebar */}
        <div style={modalLayout}>
          {/* Sidebar */}
          <div style={sidebarStyle}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                style={sidebarItemStyle(activeTab === tab.id)}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={contentAreaStyle}>
            <form id="project-form" onSubmit={handlers.handleSubmit}>
              {activeTab === 'basic' && (
                <GeneralInfoSection
                  name={states.name}
                  setName={states.setName}
                  path={states.path}
                  setPath={states.setPath}
                  onBrowse={handlers.handleBrowse}
                />
              )}

              {activeTab === 'platforms' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                  <PlatformConfigSection
                    title="iOS Platform"
                    icon={<AppleIcon size={14} />}
                    iconContainerClass="icon-container-primary"
                    bundleIdLabel="Bundle Identifier"
                    bundleId={states.iosBundle}
                    setBundleId={states.setIosBundle}
                    version={states.iosVersion}
                    setVersion={states.setIosVersion}
                    buildNumber={states.iosBuildNumber}
                    setBuildNumber={states.setIosBuildNumber}
                    buildNumberLabel="Build Number"
                  />

                  <PlatformConfigSection
                    title="Android Platform"
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
              )}

              {activeTab === 'configs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                  <IosBuildSettings
                    scheme={states.iosScheme}
                    setScheme={states.setIosScheme}
                    configuration={states.iosConfiguration}
                    setConfiguration={states.setIosConfiguration}
                    exportMethod={states.iosExportMethod}
                    setExportMethod={states.setIosExportMethod}
                    // These are now handled in separate Credentials tab, but kept for compatibility
                    selectedCredentialId={states.selectedIosCredentialId}
                    setSelectedCredentialId={states.setSelectedIosCredentialId}
                    credentials={states.iosCredentials}
                  />

                  <AndroidBuildSettings
                    // Kept for compatibility
                    selectedCredentialId={states.selectedAndroidCredentialId}
                    setSelectedCredentialId={states.setSelectedAndroidCredentialId}
                    buildCommand={states.androidBuildCommand}
                    setBuildCommand={states.setAndroidBuildCommand}
                    credentials={states.androidCredentials}
                    firebaseAppId={states.firebaseAppId}
                    setFirebaseAppId={states.setFirebaseAppId}
                    distributionGroups={states.distributionGroups}
                    setDistributionGroups={states.setDistributionGroups}
                  />
                </div>
              )}

              {activeTab === 'notifications' && (
                <NotificationSettings
                  projectName={states.name}
                  slackWebhook={states.slackWebhook}
                  setSlackWebhook={states.setSlackWebhook}
                  slackEnabled={states.slackEnabled}
                  setSlackEnabled={states.setSlackEnabled}
                  discordWebhook={states.discordWebhook}
                  setDiscordWebhook={states.setDiscordWebhook}
                  discordEnabled={states.discordEnabled}
                  setDiscordEnabled={states.setDiscordEnabled}
                  telegramBotToken={states.telegramBotToken}
                  setTelegramBotToken={states.setTelegramBotToken}
                  telegramChatId={states.telegramChatId}
                  setTelegramChatId={states.setTelegramChatId}
                  telegramEnabled={states.telegramEnabled}
                  setTelegramEnabled={states.setTelegramEnabled}
                />
              )}
            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--spacing-sm)',
            padding: 'var(--spacing-md) var(--spacing-lg)',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-sidebar)',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ minWidth: '100px' }}
          >
            Cancel
          </button>
          <button
            form="project-form"
            type="submit"
            className="btn btn-primary"
            style={{ minWidth: '140px' }}
          >
            {initialData ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
};
