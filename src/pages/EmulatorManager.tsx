import { useEffect, useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { useProjectStore } from '../stores/projectStore';
import {
  AndroidIcon,
  AppleIcon,
  PlayIcon,
  SmartphoneIcon,
  LinkIcon,
  MoreVerticalIcon,
  TrashIcon,
  EraserIcon,
  RefreshCwIcon,
  ScrollTextIcon,
  CameraIcon,
  StopCircleIcon,
  VideoIcon,
} from '../components/Icons';

interface Emulator {
  id: string;
  name: string;
  platform: 'android' | 'ios';
  state: 'Booted' | 'Shutdown';
  version: string;
}

export const EmulatorManager = () => {
  const [emulators, setEmulators] = useState<Emulator[]>([]);
  const [loading, setLoading] = useState(false);
  const { projects } = useProjectStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [targetEmulator, setTargetEmulator] = useState<Emulator | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await invoke<Emulator[]>('list_emulators');
      setEmulators(list);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(() => {
      invoke<Emulator[]>('list_emulators').then(setEmulators).catch(console.error);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLaunch = async (em: Emulator) => {
    setLaunchingId(em.id);
    try {
      await invoke('launch_emulator', { id: em.id, platform: em.platform });
      // Refresh with delay to allow boot process to start registering
      setTimeout(refresh, 2000);
      setTimeout(refresh, 5000);
    } catch (e) {
      alert('Failed to launch: ' + e);
    }
    // Keep loading state properly managed or clear it
    setTimeout(() => setLaunchingId(null), 2000); // Visual feedback helper
  };

  const handleRunApp = async (em: Emulator) => {
    if (!selectedProjectId) {
      alert('Please select a project first to run.');
      return;
    }
    const project = projects.find((p) => p.id === selectedProjectId);
    if (!project) return;

    try {
      await invoke('run_app_on_emulator', {
        projectPath: project.path,
        platform: em.platform,
        deviceId: em.id,
        deviceName: em.name,
      });
    } catch (e) {
      alert('Failed to run app: ' + e);
    }
  };

  const handleDeepLink = (em: Emulator) => {
    setTargetEmulator(em);
    setShowLinkModal(true);
  };

  const confirmDeepLink = async (em: Emulator, url: string) => {
    console.log('Opening deep link:', url, 'on', em.platform, em.id);
    try {
      await invoke('open_url_on_emulator', {
        url,
        platform: em.platform,
        deviceId: em.id,
      });
    } catch (e) {
      console.error('Deep link failed:', e);
      alert('Failed to open URL: ' + e);
    }
  };

  // Get selected project for platform-specific bundle IDs
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

      <div
        className="card"
        style={{ marginBottom: 'var(--spacing-xl)', padding: 'var(--spacing-lg)' }}
      >
        <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
          Select Project to Run
        </label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '10px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
          }}
        >
          <option value="">-- Select Project --</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {!selectedProjectId && (
          <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-warning)' }}>
            * Select a project to enable "Run App" button
          </p>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: 'var(--spacing-xl)',
        }}
      >
        {/* Android */}
        <div>
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
            <div className="icon-container icon-container-success" style={{ padding: '6px' }}>
              <AndroidIcon size={18} />
            </div>
            Android Emulators
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {loading && androidEmulators.length === 0 && <p>Loading...</p>}
            {!loading && androidEmulators.length === 0 && (
              <p style={{ color: 'var(--color-text-secondary)' }}>
                No Android emulators available.
              </p>
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
        </div>

        {/* iOS */}
        <div>
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
            <div className="icon-container icon-container-primary" style={{ padding: '6px' }}>
              <AppleIcon size={18} />
            </div>
            iOS Simulators
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {loading && iosEmulators.length === 0 && <p>Loading...</p>}
            {!loading && iosEmulators.length === 0 && (
              <p style={{ color: 'var(--color-text-secondary)' }}>No iOS simulators available.</p>
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
        </div>
      </div>
      {showLinkModal && targetEmulator && (
        <DeepLinkModal
          initialUrl={(() => {
            const project = projects.find((p) => p.id === selectedProjectId);
            if (!project) return 'myapp://';

            const bundleId =
              targetEmulator.platform === 'ios' ? project.ios.bundleId : project.android.bundleId;
            return bundleId ? `${bundleId}://` : 'myapp://';
          })()}
          onClose={() => setShowLinkModal(false)}
          onConfirm={(url) => confirmDeepLink(targetEmulator, url)}
        />
      )}
    </div>
  );
};

const EmulatorCard = ({
  emulator,
  onLaunch,
  onRun,
  onDeepLink,
  isLaunching,
  canRun,
  selectedPackageName,
}: {
  emulator: Emulator;
  onLaunch: (e: Emulator) => void;
  onRun: (e: Emulator) => void;
  onDeepLink: (e: Emulator) => void;
  isLaunching: boolean;
  canRun: boolean;
  selectedPackageName?: string;
}) => {
  const isBooted = emulator.state === 'Booted';
  const isAndroid = emulator.platform === 'android';
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [toolLoading, setToolLoading] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Check recording status
  const checkRecordingStatus = async () => {
    try {
      const recording = await invoke<boolean>('is_device_recording', { deviceId: emulator.id });
      setIsRecording(recording);
    } catch (e) {
      console.error('Failed to check recording status:', e);
    }
  };

  useEffect(() => {
    if (isBooted) {
      checkRecordingStatus();
      const interval = setInterval(checkRecordingStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [isBooted, emulator.id]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowToolsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmulatorAction = async (action: string) => {
    if (
      !selectedPackageName &&
      !['screenshot', 'erase', 'record_start', 'record_stop'].includes(action)
    ) {
      alert('Please select a project first');
      return;
    }

    setToolLoading(action);
    try {
      if (action === 'record_start') {
        const filePath = await save({
          defaultPath: `recording_${emulator.platform}_${Date.now()}.mp4`,
          filters: [{ name: 'MPEG4 Video', extensions: ['mp4'] }],
        });
        if (filePath) {
          await invoke('start_recording', {
            deviceId: emulator.id,
            platform: emulator.platform,
            savePath: filePath,
          });
          setIsRecording(true);
        }
      } else if (action === 'record_stop') {
        const savedPath = await invoke<string>('stop_recording', { deviceId: emulator.id });
        setIsRecording(false);
        // Add a small delay for the OS to see the file as finalized
        setTimeout(() => alert(`Recording saved successfully to: ${savedPath}`), 500);
      } else if (isAndroid) {
        switch (action) {
          case 'uninstall':
            await invoke('adb_uninstall_app', {
              deviceId: emulator.id,
              packageName: selectedPackageName,
            });
            alert(`Successfully uninstalled ${selectedPackageName}`);
            break;
          case 'clearData':
            await invoke('adb_clear_app_data', {
              deviceId: emulator.id,
              packageName: selectedPackageName,
            });
            alert(`Successfully cleared data for ${selectedPackageName}`);
            break;
          case 'forceStop':
            await invoke('adb_force_stop_app', {
              deviceId: emulator.id,
              packageName: selectedPackageName,
            });
            alert(`Successfully stopped ${selectedPackageName}`);
            break;
          case 'restart':
            await invoke('adb_restart_app', {
              deviceId: emulator.id,
              packageName: selectedPackageName,
            });
            alert(`Successfully restarted ${selectedPackageName}`);
            break;
          case 'logcat':
            await invoke('adb_open_logcat', {
              deviceId: emulator.id,
              packageName: selectedPackageName,
            });
            break;
          case 'screenshot':
            const filePath = await save({
              defaultPath: `screenshot_${Date.now()}.png`,
              filters: [{ name: 'PNG Image', extensions: ['png'] }],
            });
            if (filePath) {
              await invoke('adb_take_screenshot', { deviceId: emulator.id, savePath: filePath });
              alert(`Screenshot saved to ${filePath}`);
            }
            break;
        }
      } else {
        // iOS Actions
        switch (action) {
          case 'uninstall':
            await invoke('simctl_uninstall_app', {
              deviceId: emulator.id,
              bundleId: selectedPackageName,
            });
            alert(`Successfully uninstalled ${selectedPackageName}`);
            break;
          case 'forceStop':
            await invoke('simctl_terminate_app', {
              deviceId: emulator.id,
              bundleId: selectedPackageName,
            });
            alert(`Successfully terminated ${selectedPackageName}`);
            break;
          case 'restart':
            await invoke('simctl_restart_app', {
              deviceId: emulator.id,
              bundleId: selectedPackageName,
            });
            alert(`Successfully restarted ${selectedPackageName}`);
            break;
          case 'screenshot':
            const filePath = await save({
              defaultPath: `screenshot_ios_${Date.now()}.png`,
              filters: [{ name: 'PNG Image', extensions: ['png'] }],
            });
            if (filePath) {
              await invoke('simctl_take_screenshot', { deviceId: emulator.id, savePath: filePath });
              alert(`Screenshot saved to ${filePath}`);
            }
            break;
          case 'erase':
            if (
              confirm(
                'Are you sure you want to Erase all content and settings? This cannot be undone.',
              )
            ) {
              await invoke('simctl_erase_device', { deviceId: emulator.id });
              alert('Device erased successfully');
            }
            break;
        }
      }
    } catch (e) {
      alert(`Error: ${e}`);
    } finally {
      setToolLoading(null);
      setShowToolsMenu(false);
    }
  };

  const toolsMenuItems = isAndroid
    ? [
        {
          id: 'restart',
          icon: <RefreshCwIcon size={14} />,
          label: 'Restart App',
          color: 'var(--color-primary)',
        },
        {
          id: 'forceStop',
          icon: <StopCircleIcon size={14} />,
          label: 'Force Stop',
          color: 'var(--color-warning)',
        },
        {
          id: 'clearData',
          icon: <EraserIcon size={14} />,
          label: 'Clear App Data',
          color: 'var(--color-warning)',
        },
        {
          id: 'uninstall',
          icon: <TrashIcon size={14} />,
          label: 'Uninstall App',
          color: 'var(--color-error)',
        },
        { id: 'divider' },
        {
          id: isRecording ? 'record_stop' : 'record_start',
          icon: <VideoIcon size={14} />,
          label: isRecording ? 'Stop Recording' : 'Record Screen',
          color: isRecording ? 'var(--color-error)' : 'var(--color-text-primary)',
        },
        {
          id: 'logcat',
          icon: <ScrollTextIcon size={14} />,
          label: 'View Logcat',
          color: 'var(--color-text-primary)',
        },
        {
          id: 'screenshot',
          icon: <CameraIcon size={14} />,
          label: 'Take Screenshot',
          color: 'var(--color-text-primary)',
        },
      ]
    : [
        {
          id: 'restart',
          icon: <RefreshCwIcon size={14} />,
          label: 'Restart App',
          color: 'var(--color-primary)',
        },
        {
          id: 'forceStop',
          icon: <StopCircleIcon size={14} />,
          label: 'Terminate App',
          color: 'var(--color-warning)',
        },
        {
          id: 'uninstall',
          icon: <TrashIcon size={14} />,
          label: 'Uninstall App',
          color: 'var(--color-error)',
        },
        { id: 'divider' },
        {
          id: isRecording ? 'record_stop' : 'record_start',
          icon: <VideoIcon size={14} />,
          label: isRecording ? 'Stop Recording' : 'Record Screen',
          color: isRecording ? 'var(--color-error)' : 'var(--color-text-primary)',
        },
        {
          id: 'screenshot',
          icon: <CameraIcon size={14} />,
          label: 'Take Screenshot',
          color: 'var(--color-text-primary)',
        },
        {
          id: 'erase',
          icon: <EraserIcon size={14} />,
          label: 'Wipe Device',
          color: 'var(--color-error)',
        },
      ];

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--spacing-md)',
        overflow: 'visible', // Ensure dropdown menu isn't cut off
        zIndex: showToolsMenu ? 50 : 1, // Bring to front when menu is open
      }}
    >
      <div style={{ overflow: 'hidden', marginRight: '8px' }}>
        <div
          style={{
            fontWeight: 600,
            marginBottom: '4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          title={emulator.name}
        >
          {emulator.name}{' '}
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 400 }}>
            ({emulator.version})
          </span>
          {isRecording && (
            <span
              className="animate-pulse"
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--color-error)',
                display: 'inline-block',
                boxShadow: '0 0 5px var(--color-error)',
              }}
              title="Recording in progress..."
            />
          )}
        </div>
        <div
          style={{
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--color-text-secondary)',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isBooted ? 'var(--color-success)' : 'var(--color-text-tertiary)',
            }}
          />
          {isLaunching ? 'Booting...' : emulator.state}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        {!isBooted && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => onLaunch(emulator)}
              disabled={isLaunching}
              style={{ fontSize: '13px', padding: '6px 12px', gap: '6px' }}
            >
              <PlayIcon size={14} />
              {isLaunching ? '...' : 'Boot'}
            </button>
            {!isAndroid && (
              <div style={{ position: 'relative' }} ref={menuRef}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowToolsMenu(!showToolsMenu)}
                  style={{ fontSize: '13px', padding: '6px 10px' }}
                >
                  <MoreVerticalIcon size={16} />
                </button>
                {showToolsMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '4px',
                      background: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-xl)',
                      zIndex: 1000,
                      minWidth: '180px',
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      onClick={() => handleEmulatorAction('erase')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '10px 14px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--color-error)',
                        fontSize: '13px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <EraserIcon size={14} /> Wipe Device
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {isBooted && (
          <>
            <button
              className="btn btn-secondary"
              onClick={() => onDeepLink(emulator)}
              title="Open Deep Link"
              style={{ fontSize: '13px', padding: '6px 12px', gap: '6px' }}
            >
              <LinkIcon size={14} /> Link
            </button>
            <button
              className="btn btn-primary"
              onClick={() => onRun(emulator)}
              disabled={!canRun}
              title={!canRun ? 'Select a project first' : 'Run App'}
              style={{
                fontSize: '13px',
                padding: '6px 12px',
                gap: '6px',
                opacity: canRun ? 1 : 0.5,
              }}
            >
              <SmartphoneIcon size={14} /> Run
            </button>

            {/* Tools Menu */}
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowToolsMenu(!showToolsMenu)}
                title="Emulator Tools"
                style={{ fontSize: '13px', padding: '6px 10px' }}
              >
                <MoreVerticalIcon size={16} />
              </button>

              {showToolsMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '4px',
                    background: 'var(--color-bg-primary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-xl)',
                    zIndex: 1000,
                    minWidth: '200px',
                    overflow: 'hidden',
                    animation: 'scaleIn 0.15s ease-out',
                  }}
                >
                  {toolsMenuItems.map((item) =>
                    item.id === 'divider' ? (
                      <div
                        key={item.id}
                        style={{
                          height: '1px',
                          background: 'var(--color-border)',
                          margin: '4px 0',
                        }}
                      />
                    ) : (
                      <button
                        key={item.id}
                        onClick={() => handleEmulatorAction(item.id)}
                        disabled={toolLoading !== null}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          width: '100%',
                          padding: '10px 14px',
                          border: 'none',
                          background: 'transparent',
                          color: item.color,
                          fontSize: '13px',
                          cursor: toolLoading !== null ? 'wait' : 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = 'var(--color-bg-secondary)')
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {toolLoading === item.id ? (
                          <span style={{ width: 14, height: 14 }}>⏳</span>
                        ) : (
                          item.icon
                        )}
                        {item.label}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const DeepLinkModal = ({
  initialUrl,
  onClose,
  onConfirm,
}: {
  initialUrl: string;
  onClose: () => void;
  onConfirm: (url: string) => void;
}) => {
  const [url, setUrl] = useState(initialUrl);

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
      }}
    >
      <div
        className="card"
        style={{
          width: '400px',
          padding: 'var(--spacing-lg)',
          background: 'var(--color-bg-primary)',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
          Open Deep Link
        </h3>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="myapp://..."
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: 'var(--spacing-lg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
          }}
          autoFocus
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (url) onConfirm(url);
              onClose();
            }}
          >
            Open
          </button>
        </div>
      </div>
    </div>
  );
};
