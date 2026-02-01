import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useProjectStore } from '../stores/projectStore';
import { AndroidIcon, AppleIcon, SmartphoneIcon } from '../components/Icons';
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
      console.error('Failed to open URL:', e);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const androidEmulators = emulators.filter((e) => e.platform === 'android');
  const iosEmulators = emulators.filter((e) => e.platform === 'ios');

  return (
    <div
      className="page-container"
      style={{
        padding: 'var(--spacing-2xl)',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        maxWidth: '1600px',
        margin: '0 auto',
      }}
    >
      {/* Premium Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          flexShrink: 0,
          animation: 'fadeInDown 0.5s ease-out',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                color: 'var(--color-primary)',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Studio tools
            </span>
          </div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: 'var(--color-text)',
              letterSpacing: '-0.02em',
            }}
          >
            Device Manager
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', marginTop: '4px' }}>
            Boot, manage and orchestrate your virtual testing fleet.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--color-text-tertiary)',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Fleet Size
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)' }}>
              {emulators.length}
            </div>
          </div>
          <div style={{ width: '1px', height: '40px', background: 'var(--color-border)' }} />
          <ProjectSelector
            projects={projects}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
          />
        </div>
      </header>

      {/* Main Content - Scrollable grid */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          paddingBottom: '40px',
          animation: 'fadeIn 0.6s ease',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
            gap: '32px',
          }}
        >
          {/* Android Section */}
          <section
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
            }}
          >
            <SectionHeader
              title="Android Fleet"
              icon={<AndroidIcon size={20} />}
              containerClass="icon-container-success"
              count={androidEmulators.length}
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {loading && androidEmulators.length === 0 && (
                <div
                  style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: 'var(--color-text-tertiary)',
                  }}
                >
                  Scanning devices...
                </div>
              )}
              {!loading && androidEmulators.length === 0 && (
                <div
                  className="card"
                  style={{ padding: '40px', textAlign: 'center', borderStyle: 'dashed' }}
                >
                  <SmartphoneIcon size={32} style={{ opacity: 0.2, marginBottom: '12px' }} />
                  <p style={{ color: 'var(--color-text-secondary)' }}>No AVDs detected.</p>
                </div>
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
          <section
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both',
            }}
          >
            <SectionHeader
              title="iOS Simulators"
              icon={<AppleIcon size={20} />}
              containerClass="icon-container-primary"
              count={iosEmulators.length}
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {loading && iosEmulators.length === 0 && (
                <div
                  style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: 'var(--color-text-tertiary)',
                  }}
                >
                  Querying SimCtl...
                </div>
              )}
              {!loading && iosEmulators.length === 0 && (
                <div
                  className="card"
                  style={{ padding: '40px', textAlign: 'center', borderStyle: 'dashed' }}
                >
                  <AppleIcon size={32} style={{ opacity: 0.2, marginBottom: '12px' }} />
                  <p style={{ color: 'var(--color-text-secondary)' }}>No simulators found.</p>
                </div>
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
      </div>

      {showLinkModal && targetEmulator && (
        <DeepLinkModal
          initialUrl={getInitialDeepLinkUrl(targetEmulator, selectedProject)}
          onClose={() => setShowLinkModal(false)}
          onConfirm={(url) => confirmDeepLink(targetEmulator, url)}
        />
      )}

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </div>
  );
};

const SectionHeader = ({
  title,
  icon,
  containerClass,
  count,
}: {
  title: string;
  icon: React.ReactNode;
  containerClass: string;
  count: number;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <h2
      style={{
        fontSize: '18px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: 'var(--color-text)',
      }}
    >
      <div
        className={`icon-container ${containerClass}`}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      {title}
    </h2>
    <span
      style={{
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--color-text-tertiary)',
        background: 'var(--color-sidebar)',
        padding: '4px 10px',
        borderRadius: '8px',
      }}
    >
      {count} found
    </span>
  </div>
);

const getInitialDeepLinkUrl = (emulator: Emulator, project: any) => {
  if (!project) return 'myapp://';
  const bundleId = emulator.platform === 'ios' ? project.ios.bundleId : project.android.bundleId;
  return bundleId ? `${bundleId}://` : 'myapp://';
};
