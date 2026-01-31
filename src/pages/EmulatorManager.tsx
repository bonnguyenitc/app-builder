import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useProjectStore } from '../stores/projectStore';
import { AndroidIcon, AppleIcon } from '../components/Icons';
import { useEmulators, Emulator } from '../hooks/useEmulators';
import { ProjectSelector } from '../components/EmulatorManager/ProjectSelector';
import { EmulatorCard } from '../components/EmulatorManager/EmulatorCard';
import { DeepLinkModal } from '../components/EmulatorManager/DeepLinkModal';

export const EmulatorManager = () => {
  const {
    emulators,
    loading,
    selectedProjectId,
    setSelectedProjectId,
    launchingId,
    handleLaunch,
    handleRunApp,
  } = useEmulators();

  const { projects } = useProjectStore();
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [targetEmulator, setTargetEmulator] = useState<Emulator | null>(null);

  const handleDeepLink = (em: Emulator) => {
    setTargetEmulator(em);
    setShowLinkModal(true);
  };

  const confirmDeepLink = async (em: Emulator, url: string) => {
    try {
      await invoke('open_url_on_emulator', {
        url,
        platform: em.platform,
        deviceId: em.id,
      });
    } catch (e) {
      alert('Failed to open URL: ' + e);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const androidEmulators = emulators.filter((e) => e.platform === 'android');
  const iosEmulators = emulators.filter((e) => e.platform === 'ios');

  return (
    <div>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            marginBottom: '4px',
            color: 'var(--color-primary)',
          }}
        >
          Emulator Manager
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Manage and run simulators & emulators
        </p>
      </div>

      <ProjectSelector
        projects={projects}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: 'var(--spacing-xl)',
        }}
      >
        {/* Android Section */}
        <section>
          <SectionHeader
            title="Android Emulators"
            icon={<AndroidIcon size={18} />}
            containerClass="icon-container-success"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {loading && androidEmulators.length === 0 && <p>Loading...</p>}
            {!loading && androidEmulators.length === 0 && (
              <p style={{ color: 'var(--color-text-secondary)' }}>No Android emulators.</p>
            )}
            {androidEmulators.map((e) => (
              <EmulatorCard
                key={e.id}
                emulator={e}
                onLaunch={handleLaunch}
                onRun={handleRunApp}
                onDeepLink={handleDeepLink}
                isLaunching={launchingId === e.id}
                canRun={!!selectedProjectId}
                selectedPackageName={selectedProject?.android?.bundleId}
              />
            ))}
          </div>
        </section>

        {/* iOS Section */}
        <section>
          <SectionHeader
            title="iOS Simulators"
            icon={<AppleIcon size={18} />}
            containerClass="icon-container-primary"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {loading && iosEmulators.length === 0 && <p>Loading...</p>}
            {!loading && iosEmulators.length === 0 && (
              <p style={{ color: 'var(--color-text-secondary)' }}>No iOS simulators.</p>
            )}
            {iosEmulators.map((e) => (
              <EmulatorCard
                key={e.id}
                emulator={e}
                onLaunch={handleLaunch}
                onRun={handleRunApp}
                onDeepLink={handleDeepLink}
                isLaunching={launchingId === e.id}
                canRun={!!selectedProjectId}
                selectedPackageName={selectedProject?.ios?.bundleId}
              />
            ))}
          </div>
        </section>
      </div>

      {showLinkModal && targetEmulator && (
        <DeepLinkModal
          initialUrl={getInitialDeepLinkUrl(targetEmulator, selectedProject)}
          onClose={() => setShowLinkModal(false)}
          onConfirm={(url) => confirmDeepLink(targetEmulator, url)}
        />
      )}
    </div>
  );
};

const SectionHeader = ({
  title,
  icon,
  containerClass,
}: {
  title: string;
  icon: React.ReactNode;
  containerClass: string;
}) => (
  <h2
    style={{
      fontSize: '18px',
      fontWeight: 600,
      marginBottom: 'var(--spacing-lg)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}
  >
    <div className={`icon-container ${containerClass}`} style={{ padding: '6px' }}>
      {icon}
    </div>
    {title}
  </h2>
);

const getInitialDeepLinkUrl = (emulator: Emulator, project: any) => {
  if (!project) return 'myapp://';
  const bundleId = emulator.platform === 'ios' ? project.ios.bundleId : project.android.bundleId;
  return bundleId ? `${bundleId}://` : 'myapp://';
};
